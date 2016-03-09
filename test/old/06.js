import { serve } from '../docs/06'
import { check } from './utils'

describe ('06 - Static Methods', function() {

  it ('should create a new person', function() {

    const q = `mutation {
      API__createPerson(name: "trent", age: 21, knows: ["daria", "jane"]) {
        name
        age
        knows {
          name
          age
        }
      }
    }`

    const r = {
      "API__createPerson": {
        "name": "trent",
        "age": 21,
        "knows": [
          {
            "name": "daria",
            "age": 17
          },
          {
            "name": "jane",
            "age": 17
          }
        ]
      }
    }

    return check(serve, q, r)

  })

  it ('should create inverse relationships', function() {

    const q = `{
      API {
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
        "person": {
          "name": "daria",
          "age": 17,
          "knows": [
            {
              "name": "jane",
              "age": 17
            },
            {
              "name": "quinn",
              "age": 15
            },
            {
              "name": "trent",
              "age": 21
            }
          ]
        }
      }
    }

    return check(serve, q, r)

  })


})
