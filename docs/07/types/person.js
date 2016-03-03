// types/person.js

import { field
       , mutation
       , service
       , args
       , description
       , RadType
       } from '../../../src'

// person implementation
class Person extends RadType {

  static description = "A simple person"

  @ service("Person")
  @ args({ name: "string!" })
  static get(root, { name }) {
    const Store = root.e$.Store
    const person = Store.getObject({ type: "people", name })
    return person && new this(root, { person })
  }

  constructor(root, { person }) {
    super(root)
    this.me = person
  }

  @ service("Person")
  @ args({ name: "string!", age: "integer", knows: [ "string" ] })
  static create(root, { name, age, knows = [] }) {
    const Store = root.e$.Store
    // add person to store
    const person = Store.addObject
      ({ type: "people", name, payload: { name, age } })
    // resolve KNOWS relationships
    knows.forEach
      ( to =>
          Store.addEdge({ type: "knows", inv: "knows", from: name, to })
      )
    // return new person
    return new this(root, { person })
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
    return e$.Store.getEdges({ type: "knows", from: me.name })
      .map(name => e$.Person({ name }))
  }

  @ mutation("integer")
  @ args({ num: "integer" })
  @ description("Increase age by \"num\" (default 1)")
  birthdays({ num = 1 } = {}) {
    return this.me.age += num
  }

  @ mutation("Person")
  @ args({ other: "string!" })
  @ description("Add a KNOWS relationship")
  meet({ other }) {
    const { e$, me } = this
    e$.Store.addEdge({ type: "knows", inv: "knows", from: me.name, to: other })
    return this
  }

}

export default Person
