import _ from 'lodash'
import { throwError } from './utils'

import { GraphQLSchema
       // type constructors
       , GraphQLObjectType
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
    { services: {}
    , types:    {}
    , gql:      {}

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

  // register types
  _.forEach ( _.concat( apis, types ), registerType )

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
      case 'string':
        return GraphQLString
      case 'object':
        return GraphQLRawObject
      default:
        return registry.gql[obj]
          || throwError(`Unknown GQL Type: "${obj}"`)
    }
  }

  function gqlParseArgs(args) {
    return args && _.mapValues
      ( args
      , arg =>
        ( { type: gqlType(arg.type || arg)
          , description: arg.description
          }
        )
      )
  }

  function gqlAddField(fields, field, name) {
    // ignore helpers, mutations, etc.
    if (field.field) {
      // create field
      fields[name] =
        { type:        gqlType(field.type)
        , description: field.description
        , args:        gqlParseArgs(field.args)
        , resolve:     ( ctx, args ) =>
                         ctx[name](args)
        }
    }
    return fields
  }

  // registration methods

  function registerService(s) {
    const name = s._name || s.name
    registry.services[name] = s
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
    const gqlType = new GraphQLObjectType
      ( { name
        , description
        , fields: () => _.reduce
            ( t.prototype, gqlAddField, {} )
        }
      )
    registry.gql[name] = gqlType
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

      const baseArgs = gqlParseArgs(api.args)

      // add each mutation to the root mutation fields
      return _.reduce
        ( api.prototype
        , (fs, f, n) => {
            // ignore plain fields, helpers, etc.
            if (f.mutation) {
              // get mutation args
              const mArgs = gqlParseArgs(f.args)
              // merge mutation args with api args
              const args = baseArgs
                ? _.assign({}, baseArgs, mArgs)
                : mArgs
              // create field
              fs[`${api.name}__${n}`] =
                { type:        gqlType(api.name)
                , description: f.description
                , args:        args
                , resolve:     ( __, a, { rootValue: r } ) =>
                                 r.e$[api.name](a)
                                  .then(ctx => ctx[n](a))
                }
            }
            return fs
          }
        , fields
        )
    }
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
