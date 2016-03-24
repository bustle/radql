import Executor from './Executor'
import Registry from './Registry'

import { graphql } from 'graphql'

export default function (apis, types, services, opts) {

  const registry = Registry(apis, types, services)
  const schema   = registry.gqlSchema

  return { registry
         , schema
         , RootValue
         , serve
         }

  function RootValue(query, req) {
    return { e$: Executor(registry, req, opts)
           , opts
           , req
           }
  }

  function serve(query, vars, req) {
    return graphql(schema, query, RootValue(query, req), vars)
  }

}

export { field
       , mutation
       , type
       , args
       , description
       , service
       , fetch
       , decorates
       } from './utils/decorators'

export { RadAPI
       , RadType
       , RadService
       , RadInterface
       , RadUnion
       } from './utils/types'
