// types/person.js

import { field
       , mutation
       , args
       , description
       , RadType
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
class Person extends RadType {

  static description = "A simple person"
  static args = { name: "string!" }

  static new(root, { name }) {
    const person = people[name]
    return person && new this(root, { person })
  }

  constructor(root, { person }) {
    super(root)
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
