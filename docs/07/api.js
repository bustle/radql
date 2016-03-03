// api.js

import { field
       , mutation
       , args
       , description
       , RadAPI
       } from '../../src'

class API extends RadAPI {

  static description = "Our Fun API"

  @ field("Counter")
  @ description("Returns the counter instance")
  counter() {
    return this.e$.Counter()
  }

  @ field("Person")
  @ args({ name: "string!" })
  @ description("Finds a person by name")
  person({ name }) {
    return this.e$.Person({ name })
  }

  @ mutation("integer")
  @ description("Increment our counter by 1")
  incrementCounter() {
    return this.e$.Counter()
      .then(c => c.increment({ amount: 1 }))
  }

  @ mutation("integer")
  @ args({ name: "string!" })
  @ description("Increment a person's age by 1")
  birthday({ name }) {
    return this.e$.Person({ name })
      .then(p => p.birthdays({ num: 1 }))
  }

  @ mutation("Person")
  @ args({ name: "string!", age: "integer", knows: [ "string" ] })
  createPerson({ name, age, knows }) {
    return this.e$.Person.create({ name, age, knows })
  }

}

export default API
