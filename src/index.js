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

  function RootValue(req) {
    return { e$: Executor(registry, opts)
           , opts
           }
  }

  function serve(req, vars, opname) {
    return graphql(schema, req, RootValue(req), vars, opname)
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
       } from './utils/types'
