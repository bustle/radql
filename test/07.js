import { serve } from '../docs/07'
import { check } from './utils'

describe ('07 - Standalone Services', function() {

  it ('should perform edge mutations', function() {

    const q = `mutation {
      API__createPerson(name: "trent", age: 21, knows: ["jane"]) {
        name age knows { name age }
      }
      API__meet(name: "daria", other: "trent") {
        name age knows { name }
      }
    }`

    const r = {
      "API__createPerson": {
        "name": "trent", "age": 21, "knows": [ { "name": "jane", "age": 17 } ]
      },
      "API__meet": {
        "name": "daria", "age": 17,
        "knows": [ { "name": "jane" }, { "name": "quinn" }, { "name": "trent" } ]
      }
    }
    return check(serve, q, r)

  })

  it ('should create inverse relationships', function() {

    const q = `{
      API {
        jane: person(name: "jane") {
          name knows { name }
        }
        trent: person(name: "trent") {
          name knows { name }
        }
      }
    }`

    const r = {
      "API": {
        "jane": {
          "name": "jane", "knows": [ { "name": "daria" }, { "name": "trent" }
          ]
        },
        "trent": {
          "name": "trent", "knows": [ { "name": "jane" }, { "name": "daria" } ]
        }
      }
    }

    return check(serve, q, r)

  })


})
