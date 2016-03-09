import { serve
       , reset
       } from '../docs/11'
import { check
       , __time__
       } from './utils'

describe ('11 - Radgraph Edges', function() {

  before(function() {
    return reset()
      .then(() => serve(
        `mutation {
          b1: API__createBand ( name: "Mystik Spiral", rank: 9, genres: [ "post-alterna-grunge", "trance punk" ] ) { id name genres }
          b2: API__createBand ( name: "The Zon", rank: 5, genres: [ "industrial" ] ) { id name genres }
          b3: API__createBand ( name: "Jane's Addiction", rank: 7, genres: [ "avant-garde", "math rock" ] ) { id name genres }
          API__updateBand ( id: 3, name: "Jane's Addition", rank: -1 ) { id name rank genres }
        }`))
  })

  it ('should create augmented edges', function() {

    const q = `mutation {
      l1: API__loveBand(name: "daria", id: 1, nickname: "trents ok") { band { name } nickname }
      l2: API__loveBand(name: "jane", id: 3, rank: 11) { band { name } rank }
    }`

    const r = {
      "l1": { "band": { "name": "Mystik Spiral" }, "nickname": "trents ok" },
      "l2": { "band": { "name": "Jane's Addition" }, "rank": 11 }
    }
    return check(serve, q, r)

  })

  it ('should query augmented edges, forward and backwards', function() {

    const q = `{
      API {
        person(name: "daria") { loves { nickname band { rank } } }
        band(id: 3) { name lovedBy { rank } }
      }
    }`

    const r = {
      "API": {
        "person": { "loves": [ { "nickname": "trents ok", "band": { "rank": "9" } } ] },
        "band": { "name": "Jane's Addition", "lovedBy": [ { "rank": 11 } ] }
      }
    }

    return check(serve, q, r)

  })

  it ('should implement decorators', function() {

    const q = `{
      API {
        daria: person(name: "daria") { loves { nickname rank } }
        jane: person(name: "jane") { loves { nickname rank } }
      }
    }`

    const r = {
      "API": {
        "daria": { "loves": [ { "nickname": "trents ok", "rank": 9 } ] },
        "jane": { "loves": [ { "nickname": "Jane's Addition", "rank": 11 } ] }
      }
    }

    return check(serve, q, r)

  })


})
