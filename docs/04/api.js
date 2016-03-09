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

  @ mutation
  @ description("Increment our counter by 1")
  incrementCounter() {
    return this.e$.Counter()
      .then(c => c.increment({ amount: 1 }))
  }

  @ mutation
  @ args({ name: "string!" })
  @ description("Increment a person's age by 1")
  birthday({ name }) {
    return this.e$.Person({ name })
      .then(p => p.birthdays({ num: 1 }))
  }

}

export default API
