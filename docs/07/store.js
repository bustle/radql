// store.js

import { field
       , mutation
       , args
       , description
       , RadService
       } from '../../src'

// in-memory store
const store =

  { people:
    { "daria":
      { name: "daria"
      , age: 17
      }
    , "jane":
      { name: "jane"
      , age: 17
      }
    , "quinn":
      { name: "quinn"
      , age: 15
      }
    }

  , knows:
    { daria: [ "jane", "quinn" ]
    , jane: [ "daria" ]
    , quinn: [ "daria" ]
    }
  }

// store service
class Store extends RadService {

  @ field("object")
  @ args({ type: "string!", name: "string!" })
  @ description("Retrieves an object from the store")
  getObject({ type, name }) {
    return store[type][name]
  }

  @ mutation("object")
  @ args({ type: "string!", name: "string!", payload: "string!" })
  @ description("Adds an object to the store")
  addObject({ type, name, payload }) {
    if (store[type][name])
      throw new Error("Name already taken!")
    return store[type][name] = payload
  }

  @ mutation([ "string" ])
  @ args({ type: "string!", from: "string!" })
  @ description("Retrieves adjacencies from the store")
  getEdges({ type, from }) {
    return store[type][from] || []
  }

  @ mutation("string")
  @ args({ type: "string!", inv: "string", from: "string!", to: "string!" })
  @ description("Add an adjacency and its inverse, returns parent key")
  addEdge({ type, inv, from, to }) {
    // get forward adjacency list
    const f = store[type][from] = store[type][from] || []
    // insert edge if it doesn't exist
    if (!~f.indexOf(to)) f.push(to)
    // check if inverse type is provided
    if (inv) {
      // get backward adjacency list
      const b = store[inv][to] = store[inv][to] || []
      // insert edge if it doesn't exist
      if (!~b.indexOf(from)) b.push(from)
    }
    return from
  }

}

export default Store
