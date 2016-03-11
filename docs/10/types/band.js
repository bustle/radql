// types/band.js

import Promise from 'bluebird'

import { field
       , mutation
       , service
       , args
       , description
       , RadType
       } from '../../../src'

import { Type } from '../../../src/radredis'
import source from '../services/radredis'

// initialize schema
const schema =
  { title: "Band2" // workaround for type memoization in tests
  , type: "Band"   // this should never happen in real use cases
  , properties:
    { name: { type: "string" }
    , rank: { type: "integer", index: true }
    , genres: { type: "array" }
    }
  }

// generate base class
const Radredis = Type(source, schema)

// Band type definition
class Band extends Radredis {

  @ service
  static all(root, { limit, offset }) {
    return Radredis.all(root, { limit, offset })
      .map(attrs => new this(root, attrs))
  }

  @ service
  static top(root, { min = 0, max = 10, offset, limit }) {
    return Radredis.range(root, { index: 'rank', max, min, offset, limit })
      .map(attrs => new this(root, attrs))
  }

  @ service
  static create(root, attrs) {
    return Radredis.create(root, attrs)
      .then(attrs => new this(root, attrs))
  }

  @ field("id!")
  id() { return this.attr('id') }

  @ field("string")
  @ description("Name of the band")
  name() { return this.attr('name') }

  @ field("string")
  @ description("Rank based on Pitchfork reviews")
  rank() { return this.attr('rank') }

  @ field([ "string" ])
  @ description("Genres the band identifies as")
  genres() { return this.attr('genres') }

  @ field([ "Person" ])
  @ description("List of people who like this band")
  likedBy() {
    const { e$, _id: id } = this
    return e$.Likes.inv
      .from(id, { limit: 0 })
      .map(edge => e$.Person({ name: edge.to }))
  }

  @ mutation("Band")
  @ args({ name: "string", rank: "integer", genres: [ "string" ] })
  @ description("Update band values")
  update({ name, rank, genres }) {
    this.setAttr('name', name)
    this.setAttr('rank', rank)
    this.setAttr('genres', genres)
    return this._update()
  }

  @ mutation("Band")
  @ description("Removes a band from the face of the earth")
  delete() {
    return this._delete()
  }

}

export default Band
