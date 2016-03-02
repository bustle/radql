import { serve } from '../docs/04'
import { check
       , __time__
       } from './utils'

describe ('04 - Data Types', function() {

  it ('should perform a basic query', function() {

    const q = `{
      API {
        counter { value }
        person(name: "daria") { age }
      }
    }`
    const r = {
      "API": {
        "counter": { "value": 0 },
        "person": { "age": 17 }
      }
    }

    return check(serve, q, r)

  })

  it ('should perform mutations', function() {

    const q = `mutation {
      i1: API__incrementCounter
      i2: API__incrementCounter
      i3: API__incrementCounter
      daria: API__birthday(name: "daria")
      jane: API__birthday(name: "jane")
    }`
    const r = {
      "i1": 1,
      "i2": 2,
      "i3": 3,
      "daria": 18,
      "jane": 18
    }

    return check(serve, q, r)

  })

  it ('resolve missing person to null', function() {

    const q = `{
      API {
        counter { value mod fourth: mod(offset: 3) }
        daria: person(name: "daria") { name age }
        trent: person(name: "trent") { name age }
      }
    }`
    const r = {
      "API": {
        "counter": { "value": 3, "mod": __time__, "fourth": null },
        "daria": { "name": "daria", "age": 18 },
        "trent": null
      }
    }
    return check(serve, q, r)

  })


})
