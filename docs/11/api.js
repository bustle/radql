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

  @ field("Band")
  @ args({ id: "id!" })
  @ description("Find a band by id")
  band({ id }) {
    return this.e$.Band({ id })
  }

  @ field([ "Band" ])
  @ args({ limit: "integer", offset: "integer" })
  bands(args) {
     return this.e$.Band.all(args)
  }

  @ field([ "Band" ])
  @ args({ limit: "integer", offset: "integer" })
  topbands(args) {
    return this.e$.Band.top(args)
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
    return this.e$.Person.create(name, age, knows)
  }

  @ mutation("Band")
  @ args({ name: "string!", rank: "integer", genres: [ "string" ] })
  createBand(attrs) {
    return this.e$.Band.create(attrs)
  }

  @ mutation("Band")
  @ args({ id: "id!", name: "string", rank: "integer", genres: [ "string" ] })
  updateBand({ id, name, rank, genres }) {
    return this.e$.Band({ id })
      .then(b => b.update({ name, rank, genres }))
  }

  @ mutation("Band")
  @ args({ id: "id!" })
  deleteBand({ id }) {
    return this.e$.Band({ id })
      .then(b => b.delete())
  }

  @ mutation("Band")
  @ args({ name: "string!", id: "id!" })
  likeBand({ id, name }) {
    return this.e$.Likes.add(name, id)
      .then(edge => this.e$.Band({ id: edge.to }))
  }

  @ mutation("Loved")
  @ args({ name: "string!", id: "id!", nickname: "string", rank: "integer" })
  loveBand({ id, name, nickname, rank }) {
    return this.e$.Loved.create(name, id, { nickname, rank })
  }


}

export default API
