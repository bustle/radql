import { serve
       , reset
       } from '../docs/10'
import { check
       , __time__
       } from './utils'

describe ('10 - Radgraph', function() {

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

  it ('should create new edges', function() {

    const q = `mutation {
      l1: API__likeBand(name: "daria", id: 1) { name }
      l2: API__likeBand(name: "daria", id: 2) { name }
      l3: API__likeBand(name: "jane", id: 3) { name }
    }`

    const r = {
      "l1": { "name": "Mystik Spiral" },
      "l2": { "name": "The Zon" },
      "l3": { "name": "Jane's Addition" }
    }
    return check(serve, q, r)

  })

  it ('should query edges, forward and backwards', function() {

    const q = `{
      API {
        person(name: "daria") { name age likes { name genres } }
        band(id: 3) { name id likedBy { name age } }
      }
    }`

    const r = {
      "API": {
        "person": {
          "name": "daria",
          "age": 17,
          "likes": [
            { "name": "The Zon", "genres": [ "industrial" ] },
            { "name": "Mystik Spiral", "genres": [ "post-alterna-grunge", "trance punk" ] }
          ]
        },
        "band": {
          "name": "Jane's Addition",
          "id": "3",
          "likedBy": [ { "name": "jane", "age": 17 } ]
        }
      }
    }

    return check(serve, q, r)

  })


})
