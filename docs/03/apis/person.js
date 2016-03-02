// apis/person.js

import { field
       , mutation
       , args
       , description
       , RadAPI
       } from '../../../src'

// in-memory person store
let people =
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

// person implementation
class Person extends RadAPI {

  static description = "A simple person API"
  static args = { name: "string!" }

  constructor(root, { name }) {
    super(root)
    const person = people[name]
    if (!person)
      throw new Error("Person not found!")
    this.me = person
  }

  @ field("string")
  @ description("The name of the specified person")
  name() {
    return this.me.name
  }

  @ field("integer")
  @ description("The age of the specified person")
  age() {
    return this.me.age
  }

  @ mutation("integer")
  @ args({ num: "integer" })
  @ description("Increase age by \"num\" (default 1)")
  birthdays({ num = 1 } = {}) {
    return this.me.age += num
  }

}

export default Person
