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
const schema =
  { title: "Band"
  , properties:
    { name: { type: "string", lazy: true }
    , rank: { type: "integer", lazy: true }
    , genres: { type: "array", lazy: true }
    , statement: { type: "string", lazy: true }
    }
  }

// generate base class
const Radredis = Type(source, schema)

// Band type definition
class Band extends Radredis {

  @ service([ "Band" ])
  @ args({ index: "string", offset: "integer", limit: "integer" })
  static all(root, args) {
    return Radredis.all(root, args)
      .map(attrs => new this(root, attrs))
  }

  @ service("Band")
  @ args({ name: "string", rank: "integer", genres: [ "string" ] })
  static create(root, args) {
    return Radredis.create(root, args)
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

  @ field("string")
  @ description("The band's artistic statement")
  statement() {
    return this.attr('statement')
  }

  @ mutation("Band")
  @ description("Update band values")
  update(args) {
    return this._update(args)
  }

}

export default Band
