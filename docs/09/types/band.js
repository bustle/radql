// types/band.js

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
// this determines the this.attrs and this.lazy property
const schema =
  { title: "Band"
  , properties:
    { name: { type: "string", index: true }
    , genres: { type: "array" }
    , statement: { type: "string", lazy: true }
    }
  }

// generate base class
const Radredis = Type(source, schema)

// Band type definition
class Band extends Radredis {

  @ service([ "Band" ])
  static all = Radredis.all

  @ service("Band")
  static create(root, args) {
    return Radredis.create(root, args)
      .then(attrs => new this(root, attrs))
  }

  @ field("id!")
  id() { return this.attrs.id }

  @ field("string")
  @ description("Name of the band")
  name() {
    return this.attrs.name
  }

  @ field([ "string" ])
  @ description("Genres the band identifies as")
  genres() {
    return this.attrs.genres
  }

  @ field("string")
  @ description("The band's artistic statement")
  statement() {
    return this.lazy('statement')
  }

}

export default Band
