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
    , serviceFor
    , gqlType

    // mutators
    // avoid if possible, this fucks with dependency order
    , registerService
    , registerType
    }

  // register services
  _.forEach ( services, registerService )

  // register types
  _.forEach ( types, registerType )

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

  function serviceFor(obj) {
    const s = type(obj).service
    return (typeof s === "string")
      ? service(s)
      : s
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

  function gqlAdd(kind) {
    return function(fields, field, name) {
      // ignore anything that isn't a field/mutation/ etc.
      if (!(field[kind]))
        return fields
      // create field
      fields[name] =
        { type:        gqlType(field.type)
        , description: field.description
        , args:        gqlParseArgs(field.args)
        , resolve:     ( ctx, args ) =>
                         ctx[name](args)
        }
      return fields
    }
  }

  // registration methods

  function registerService(s) {
    registry.services[s.name] = s
  }

  function registerType(t) {
    const { name, description } = t
    registry.types[name] = t
    const gqlType = new GraphQLObjectType
      ( { name
        , description
        , fields: () => _.reduce
            ( t.prototype, gqlAdd('field'), {} )
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
      , (b, api) => b || ! _.isEmpty( api.mutations )
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
      const gqlType = new GraphQLObjectType
        ( { name: api.name
          , description: api.description
          , fields: () => _.reduce
              ( api.prototype
              , gqlAdd('field')
              , {}
              )
          } )
      registry.gql[api.name] = gqlType
      fields[api.name] =
        { type: gqlType
        , description: api.description
        , args: gqlParseArgs(api.args)
        , resolve: (_, a, { rootValue: r }) => new api(r, a)
        }
      return fields
    }

    function apiMutations(fields, api) {
      return _.reduce
        ( api.prototype
        , gqlAdd('mutation')
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
