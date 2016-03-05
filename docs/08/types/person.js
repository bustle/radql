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

  constructor(root, person) {
    super(root)
    this.me = person
  }

  @ service
  static get(root, { name }) {
    return root.e$.Store.get(`person__${name}`)
      .then(person => new this(root, person))
  }

  @ service
  static create(root, name, age, knows = []) {
    const Store = root.e$.Store
    const person = { name, age }
    return knows
      // resolve KNOWS relationships sequentially
      .reduce
        ( (prev, curr) =>
            prev.then( () => Store.push(`knows__${curr}`, name) )
        , Promise.resolve()
        )
      // create KNOWS relationship for new person
      .then(() => Store.set(`knows__${name}`, knows))
      // save new person to store
      .then(() => Store.set(`person__${name}`, person))
      // return new person
      .then(() => new this(root, person))
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
    return e$.Store.get(`knows__${me.name}`)
      .then(names => names.map(name => e$.Person({ name })))
  }

  @ mutation("integer")
  @ args({ num: "integer" })
  @ description("Increase age by \"num\" (default 1)")
  birthdays({ num = 1 } = {}) {
    const { e$, me } = this
    me.age += num
    return e$.Store.set(`person__${me.name}`, me)
      .then(() => me.age)
  }

}

export default Person
