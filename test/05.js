import { serve } from '../docs/05'
import { check } from './utils'

describe ('05 - Data Composition', function() {

  it ('should perform a nested query', function() {

    const q = `{
      API {
        person(name: "daria") {
          name age
          knows {
            name age
            knows {
              name age
              knows { name age }
            }
          }
        }
      }
    }`

    const r =
    {
    "API": {
      "person": {
        "name": "daria",
        "age": 17,
        "knows": [
          {
            "name": "jane",
            "age": 17,
            "knows": [
              {
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
                  }
                ]
              }
            ]
          },
          {
            "name": "quinn",
            "age": 15,
            "knows": [
              {
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
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  }

    return check(serve, q, r)

  })

})
