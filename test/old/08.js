import { serve
       , reset
       } from '../docs/08'
import { check
       , __time__
       } from './utils'

describe ('08 - Batching Execution', function() {

  before(function() {
    return reset()
  })

  it ('should write mutations to disk', function() {

    const q = `mutation {
      i1: API__incrementCounter
      i2: API__incrementCounter
      i3: API__incrementCounter
      API__createPerson(name: "trent", age: 20, knows: [ "jane", "daria" ]) {
        name
        age
        knows {
          name
          age
        }
      }
      API__birthday(name: "daria")
    }`

      const r = {
      "i1": 1,
      "i2": 2,
      "i3": 3,
      "API__createPerson": {
        "name": "trent", "age": 20,
        "knows": [
          { "name": "jane", "age": 17 },
          { "name": "daria", "age": 17 }
        ]
      },
      "API__birthday": 18
    }
    return check(serve, q, r)

  })

  it ('should persist mutations', function() {

    const q = `{
      API {
        counter {
          value
          mod(offset: 2)
        }
        person(name: "daria") {
          name
          age
          knows {
            name
            age
          }
        }
      }
    }`

    const r = {
    "API": {
      "counter": { "value": 3, "mod": __time__ },
      "person": {
        "name": "daria", "age": 18,
        "knows": [
          { "name": "jane", "age": 17 },
          { "name": "quinn", "age": 15 },
          { "name": "trent", "age": 20 }
        ]
      }
    }
  }

    return check(serve, q, r)

  })


})
