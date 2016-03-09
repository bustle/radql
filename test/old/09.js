import { serve
       , reset
       } from '../docs/09'
import { check
       , __time__
       } from './utils'

describe ('09 - Radredis', function() {

  before(function() {
    return reset()
  })

  it ('should write mutations to redis', function() {

    const q = `mutation {
      b1: API__createBand ( name: "Mystik Spiral", rank: 9, genres: [ "post-alterna-grunge", "trance punk" ] ) {
        id name genres
      }
      b2: API__createBand ( name: "The Zon", rank: 5, genres: [ "industrial" ] ) {
        id name genres
      }
      b3: API__createBand ( name: "Jane's Addiction", rank: 7, genres: [ "avant-garde", "math rock" ] ) {
        id name genres
      }
      API__updateBand ( id: 3, name: "Jane's Addition", rank: -1 ) {
        id name rank genres
      }
    }`

    const r = {
      "b1": { "id": "1", "name": "Mystik Spiral", "genres": [ "post-alterna-grunge", "trance punk" ] },
      "b2": { "id": "2", "name": "The Zon", "genres": [ "industrial" ] },
      "b3": { "id": "3", "name": "Jane's Addiction", "genres": [ "avant-garde", "math rock" ] },
      "API__updateBand": { "id": "3", "name": "Jane's Addition", "rank": "-1", "genres": [ "avant-garde", "math rock" ] }
    }
    return check(serve, q, r)

  })

  it ('should query records, indices, and ranges', function() {

    const q = `{
      API {
        band(id: 2) { name rank genres }
        bands { name rank genres }
        topbands { name rank genres }
      }
    }`

  const r = {
    "API": {
      "band": { "name": "The Zon", "rank": "5", "genres": [ "industrial" ] },
      "bands": [
        { "name": "Jane's Addition", "rank": "-1", "genres": [ "avant-garde", "math rock" ] },
        { "name": "The Zon", "rank": "5", "genres": [ "industrial" ] },
        { "name": "Mystik Spiral", "rank": "9", "genres": [ "post-alterna-grunge", "trance punk" ] }
      ],
      "topbands": [
        { "name": "Mystik Spiral", "rank": "9", "genres": [ "post-alterna-grunge", "trance punk" ] },
        { "name": "The Zon", "rank": "5", "genres": [ "industrial" ] }
      ]
    }
  }

    return check(serve, q, r)

  })


})
