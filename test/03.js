import { serve } from '../docs/03'
import { check
       , __time__
       } from './utils'

describe ('03 - API Contexts', function() {

  it ('should perform a basic query', function() {

    const q = `{
      Person(name: "daria") { name age }
    }`
    const r =
    { "Person": { "name": "daria", "age": 17 }
    }

    return check(serve, q, r)

  })

  it ('should perform mutations', function() {

    const q = `mutation {
      Counter__increment(amount: 5) { value }
      daria: Person__birthdays(name: "daria", num: 2) { age }
      jane: Person__birthdays(name: "jane") { age }
      quinn: Person__birthdays(name: "quinn") { age }
    }`
    const r = {
      "Counter__increment": { "value": 5 },
      "daria": { "age": 19 },
      "jane": { "age": 18 },
      "quinn": { "age": 16 }
    }

    return check(serve, q, r)

  })

  it ('should query with labels', function() {

    const q = `{
      Counter { value mod }
      daria: Person(name: "daria") { name age }
      jane: Person(name: "jane") { name }
      quinn: Person(name: "quinn") { age }
    }`
    const r = {
    "Counter": { "value": 5, "mod": __time__ },
    "daria": { "name": "daria", "age": 19 },
    "jane": { "name": "jane" },
    "quinn": { "age": 16 }
    }

    return check(serve, q, r)

  })


})
