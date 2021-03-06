import _ from 'lodash'
import { throwError } from './utils'

import { GraphQLSchema
       // type constructors
       , GraphQLObjectType
       , GraphQLInterfaceType
       , GraphQLUnionType
       , GraphQLScalarType
       , GraphQLList
       , GraphQLNonNull
       // built-in scalars
       , GraphQLID
       , GraphQLString
       , GraphQLInt
       , GraphQLFloat
       , GraphQLBoolean
       } from 'graphql'

// This should generally only be used for proofs of concept
// although we make an exception for complicated objects like mobiledoc payloads
// to simplify deserialization
const GraphQLRawObject = new GraphQLScalarType
  ( { name: 'RawObject'
    , description:
        'Javascript POJO. This should generally be avoided except for complicated objects like mobiledoc payloads.'
    , serialize: a => a
    , parseValue: a => a
    , parseLiteral: ast =>
        ast.value ? JSON.parse(ast.value) : null
    } )

export default function ( apis = [], types = [], services = [] ) {

  const registry =

    // type/service stores:
    { services:   {}
    , types:      {}
    , interfaces: {}
    , gql:        {}

    // accessors
    , service
    , type
    , gqlType

    // mutators
    // avoid if possible, this fucks with dependency order
    , registerService
    , registerType
    }

  // register services
  _.forEach ( services, registerService )

  // handle unions and interfaces
  const unions     = _.remove( types, 'RadUnion'     )
  const interfaces = _.remove( types, 'RadInterface' )

  // register types
  _.forEach ( interfaces, registerInterface )
  _.forEach ( _.concat( apis, types ), registerType )
  _.forEach ( unions, registerUnion )

  // build schema from APIs
  registry.gqlSchema = Schema()

  // call post-registration hooks
  _.forEach
    ( _.concat ( services, types, apis )
    , ({ registered }) => registered && registered(registry)
    )

  return registry

  // I M P L E M E N T A T I O NS

  // accessors

  function service(name) {
    return registry.services[name]
  }

  function type(obj) {
    return obj
      && type(unwrapBang(obj))
      || type(unwrapList(obj))
      || registry.types[obj]
      || throwError(`Unknown Type: "${obj}"`)
  }

  function gqlType(obj) {
    let t
    if (t = unwrapBang(obj))
      return new GraphQLNonNull (gqlType(t))
    if (t = unwrapList(obj))
      return new GraphQLList    (gqlType(t))
    switch (obj) {
      case 'id':
        return GraphQLID
      case 'int': case 'integer':
        return GraphQLInt
      case 'float': case 'number':
        return GraphQLFloat
      case 'boolean': case 'bool':
        return GraphQLBoolean
      case 'string':
        return GraphQLString
      case 'object':
        return GraphQLRawObject
      default:
        return registry.gql[obj]
          || throwError(`Unknown GQL Type: "${obj}"`)
    }
  }


  // registration methods

  function registerService(s) {
    const name = s._name || s.name
    registry.services[name] = s
  }

  function registerInterface(i) {
    const { RadInterface: name, fields } = i
    if (registry.types[name]) {
      if (registry.types[name] === i)
        return
      else
        throw new Error(`ERROR: The interface name "${name}" is already in use`)
    }
    registry.types[name] = i
    const gqlInterface = new GraphQLInterfaceType
      ( { name
        , fields: () => _.mapValues
            ( fields
            , ({ type, args, description }) =>
                ( { type: gqlType(type)
                  , args: gqlParseArgs(args)
                  , description
                  }
                )
            )
        }
      )
    registry.gql[name] = gqlInterface
  }

  function registerType(t) {
    const { name, description } = t
    if (registry.types[name]) {
      if (registry.types[name] === t)
        return
      else
        throw new Error(`ERROR: The type name "${name}" is already in use`)
    }
    registry.types[name] = t
    const gqlObject = new GraphQLObjectType
      ( { name
        , description
        , fields: () => _.reduce
            ( t.prototype, gqlAddField, {} )
        , interfaces: t.interfaces && _.map(t.interfaces, gqlType)
        , isTypeOf: o => (o instanceof t)
        }
      )
    registry.gql[name] = gqlObject
  }

  function registerUnion(u) {
    const { RadUnion: name, types } = u
    if (registry.types[name]) {
      if (registry.types[name] === u)
        return
      else
        throw new Error(`ERROR: The union name "${name}" is already in use`)
    }
    registry.types[name] = u
    const gqlUnion = new GraphQLUnionType
      ( { name, types: _.map(types, gqlType) } )
    registry.gql[name] = gqlUnion
  }



  function Schema() {

    const Query = new GraphQLObjectType
      ( { name: 'RootQueryType'
        , fields: () => _.reduce
            ( apis, apiSchema, {} )
        }
      )

    const hasMutations = _.reduce
      ( apis
      , (b, api) =>
          b || _.reduce
            ( api.prototype
            , (b2, f) => b2 || f.mutation
            , false
            )
      , false
      )

    const Mutation = hasMutations && new GraphQLObjectType
      ( { name: 'RootMutationType'
        , fields: () => _.reduce
            ( apis, apiMutations, {} )
        }
      )

    return new GraphQLSchema
      ( { query: Query
        , mutation: hasMutations ? Mutation : undefined
        }
      )

    function apiSchema(fields, api) {
      fields[api.name] =
        { type: gqlType(api.name)
        , description: api.description
        , args: gqlParseArgs(api.args || api.get.args)
        , resolve: (_, a, { rootValue: r }) => r.e$[api.name](a)
        }
      return fields
    }

    function apiMutations(fields, api) {

      // add each mutation to the root mutation fields
      return _.reduce
        ( api.prototype
        , (fs, f, n) => {
            // ignore plain fields, helpers, etc.
            if (f.mutation) {
              let process = addMethod
              if (f.delegates)
                process = f.delegates.field
                  ? delegateField
                  : delegateService
              process(fs, f, n, api)
            }
            return fs
          }
        , fields
        )
    }
  }

  // HELPERS

  function gqlParseArgs(...a) {
    return _({})
      .assign(...a)
      .mapValues(arg =>
        ( { type: gqlType(arg.type || arg)
          , description: arg.description
          }
        )
      )
      .value()
  }

  function wrapPre(pre, fn) {
    return pre.name
      ? ( __, args, { rootValue: r } ) =>
          r.e$[pre.name](args)
           .then(ctx => ctx && fn(ctx, args, r))
      : ( ctx, args, { rootValue: r } ) =>
           fn(ctx, args, r)
  }

  function delegateField(fields, def, name, pre = {}) {
    const { to, field } = def.delegates
    const t = registry.types[to]
      || throwError(`Cannot delegate to type "${to}"`)
    const f = t.prototype[field]
    fields[pre.name ? `${pre.name}__${name}` : name] =
      { type:        gqlType(f.type)
      , description: f.description
      , args:        gqlParseArgs(f.args, t.args, pre.args)
      , resolve:     wrapPre
                       ( pre
                       , (__, args, r) =>
                           r.e$[to](args)
                             .then(obj => obj[field](args))
                       )
      }
  }

  function delegateService(fields, def, name, pre = {}) {
    const { to, service } = def.delegates
    const t = registry.types[to]
      || throwError(`Cannot delegate to type "${to}"`)
    const s = t[service]
    fields[pre.name ? `${pre.name}__${name}` : name] =
      { type         : gqlType(s.type)
      , description  : s.description
      , args         : gqlParseArgs(s.args, pre.args)
      , resolve      : wrapPre
                        ( pre
                        , ( __, args, r ) =>
                            r.e$[to][service](args)
                        )
      }
  }

  function addMethod(fields, field, name, pre = {}) {
    fields[pre.name ? `${pre.name}__${name}` : name] =
      { type         : gqlType(field.type)
      , description  : field.description
      , args         : gqlParseArgs(field.args, pre.args)
      , resolve      : wrapPre
                         ( pre
                         , ( ctx, args ) =>
                             ctx[name](args)
                         )
      }
  }

  function gqlAddField(fields, field, name) {
    // ignore helpers, mutations, etc.
    if (field.field) {
      let process = addMethod
      if (field.delegates)
        process = field.delegates.field
          ? delegateField
          : delegateService
      process(fields, field, name)
    }
    return fields
  }
}

function unwrapBang(obj) {
  return (typeof obj === "string")
    && (obj.slice(-1) === "!")
    && obj.slice(0, -1)
}

function unwrapList(obj) {
  return _.isArray(obj) && obj[0]
}
