// types/person.js

import { field
       , mutation
       , service
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

// in-memory "knows" store
let knows =
  { daria: [ "jane", "quinn" ]
  , jane: [ "daria" ]
  , quinn: [ "daria" ]
  }

// person implementation
class Person extends RadType {

  static description = "A simple person"

  constructor(root, person) {
    super(root)
    this.me = person
  }

  @ service
  static get(root, { name }) {
    const person = people[name]
    return person && new this(root, person)
  }

  @ service
  static create(root, name, age, k = []) {
    // check that person does not exist
    if (people[name])
      throw new Error("That name is already taken!")
    // create person POJO
    const person = { name, age }
    // resolve KNOWS relationships
    k.forEach(other => knows[other].push(name))
    // Save to store
    people[name] = person
    knows[name] = k
    // return new person
    return new this(root, person)
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

  @ field([ "Person" ])
  @ description("List of people known by the specified person")
  knows() {
    const { e$, me } = this
    return knows[me.name]
      .map(name => e$.Person({ name }))
  }

  @ mutation("integer")
  @ args({ num: "integer" })
  @ description("Increase age by \"num\" (default 1)")
  birthdays({ num = 1 } = {}) {
    return this.me.age += num
  }

}

export default Person
