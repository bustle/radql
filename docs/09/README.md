# 09. Radredis

RadQL comes bundled with `radredis` and `radgraph` integration out of the box.
All we need to do is run `npm install --save radredis radgraph`.
For convenience methods such as promise maps, we will also run `npm install --save bluebird`.

Let's add a new data type, `Band`, that will be managed by `radredis`

### Service

To begin, we create a service that manages our connection to the `radredis` server:

```js
// services/radredis.js

import { Source } from 'radql/lib/radredis'

const opts =
  { name: 'Radredis'
  , db: 2
  }

export default Source(opts)
```

This will create a new service, `e$.Radredis`. This must be registered, although it is unlikely that you will ever need to talk to this directly.

### Schema

```js
// types/band.js

const schema =
  { title: "Band"
  , properties:
    { name: { type: "string" }
    , rank: { type: "integer", index: true }
    , genres: { type: "array" }
    }
  }
```

We create a schema for our `Band` type. See the `radredis` documentation for more information.
Note that we introduce a new property called `lazy`. `lazy` fields will only be fetched if asked for, and are accessed through `this.lazy(name)` rather than `this.attrs[name]`.

### Type

```js
// ... types/band.js

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
  static top(root, { min = 0, max, offset, limit }) {
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

  @ mutation("Band")
  @ args({ name: "string", rank: "integer", genres: [ "string" ] })
  @ description("Update band values")
  update({ name, rank, genres }) {
    return this._update({ name, rank, genres })
  }

  @ mutation("Band")
  @ description("Removes a band from the face of the earth")
  delete() {
    return this._delete()
  }

}

export default Band
```

We declare a base class by running `Type(source, schema)`.
This will create an object which implements our constructor, and provides static helper methods such as
`Radredis.all(root, args)`, `Radredis.range(root, args)`, and `Radredis.create(root, attrs)`, as well as prototype properties
such as `.attr(name)`, `._id`, `._update(attrs)` and `._delete()`.

We now register our type and source:

```js
// ... index.js

import Band    from './types/band'
import Counter from './types/counter'
import Person  from './types/person'

const Types =
  [ Band
  , Counter
  , Person
  ]

import Store    from './services/store'
import Radredis from './services/radredis'

const Services =
  [ Store
  , Radredis
  ]

// ...
```

And expose our new type in the API:

```js
// ... api.js

class API extends RadAPI {

  // ...

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

  // ...

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

}

export default API
```

We can now perform the following queries:

### Mutations

```graphql
mutation {
  b1: API__createBand ( name: "Mystik Spiral", rank: 9, genres: [ "post-alterna-grunge", "trance punk" ] ) {
    id
    name
    genres
  }
  b2: API__createBand ( name: "The Zon", rank: 5, genres: [ "industrial" ] ) {
    id
    name
    genres
  }
  b3: API__createBand ( name: "Jane's Addiction", rank: 7, genres: [ "avant-garde", "math rock" ] ) {
    id
    name
    genres
  }
  API__updateBand ( id: 3, name: "Jane's Addition", rank: -1 ) {
    id
    name
    rank
    genres
  }
}
```
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20b1%3A%20API__createBand%20%28%20name%3A%20%22Mystik%20Spiral%22%2C%20rank%3A%209%2C%20genres%3A%20[%20%22post-alterna-grunge%22%2C%20%22trance%20punk%22%20]%20%29%20{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20genres%0A%20%20}%0A%20%20b2%3A%20API__createBand%20%28%20name%3A%20%22The%20Zon%22%2C%20rank%3A%205%2C%20genres%3A%20[%20%22industrial%22%20]%20%29%20{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20genres%0A%20%20}%0A%20%20b3%3A%20API__createBand%20%28%20name%3A%20%22Jane%27s%20Addiction%22%2C%20rank%3A%207%2C%20genres%3A%20[%20%22avant-garde%22%2C%20%22math%20rock%22%20]%20%29%20{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20genres%0A%20%20}%0A%20%20API__updateBand%20%28%20id%3A%203%2C%20name%3A%20%22Jane%27s%20Addition%22%2C%20rank%3A%20-1%20%29%20{%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20rank%0A%20%20%20%20genres%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "b1": {
      "id": "1",
      "name": "Mystik Spiral",
      "genres": [
        "post-alterna-grunge",
        "trance punk"
      ]
    },
    "b2": {
      "id": "2",
      "name": "The Zon",
      "genres": [
        "industrial"
      ]
    },
    "b3": {
      "id": "3",
      "name": "Jane's Addiction",
      "genres": [
        "avant-garde",
        "math rock"
      ]
    },
    "API__updateBand": {
      "id": "3",
      "name": "Jane's Addition",
      "rank": "-1",
      "genres": [
        "avant-garde",
        "math rock"
      ]
    }
  }
}
```

### Queries

```graphql
{
  API {
    band(id: 2) {
      name
      rank
      genres
    }
    bands {
      name
      rank
      genres
    }
    topbands {
      name
      rank
      genres
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20band%28id%3A%202%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20rank%0A%20%20%20%20%20%20genres%0A%20%20%20%20}%0A%20%20%20%20bands%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20rank%0A%20%20%20%20%20%20genres%0A%20%20%20%20}%0A%20%20%20%20topbands%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20rank%0A%20%20%20%20%20%20genres%0A%20%20%20%20}%0A%20%20}%0A}%0A" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "band": {
        "name": "The Zon",
        "rank": "5",
        "genres": [
          "industrial"
        ]
      },
      "bands": [
        {
          "name": "Jane's Addition",
          "rank": "-1",
          "genres": [
            "avant-garde",
            "math rock"
          ]
        },
        {
          "name": "The Zon",
          "rank": "5",
          "genres": [
            "industrial"
          ]
        },
        {
          "name": "Mystik Spiral",
          "rank": "9",
          "genres": [
            "post-alterna-grunge",
            "trance punk"
          ]
        }
      ],
      "topbands": [
        {
          "name": "Mystik Spiral",
          "rank": "9",
          "genres": [
            "post-alterna-grunge",
            "trance punk"
          ]
        },
        {
          "name": "The Zon",
          "rank": "5",
          "genres": [
            "industrial"
          ]
        }
      ]
    }
  }
}
```

### TODO: Full documentation of Radredis API

Let `Model` be be a `Radredis` model, `Radredis` be the result of calling `Type(source, schema)`, and `this` an instance of the data type:

- `new Radredis(root, attrs)` creates a new instance `this` from the starting attributes. An `id` is mandatory.
- `Radredis.all(root, { index, offset, limit })` performs `Model.all({ index, offset, limit, properties: [ 'id' ] })`
- `Radredis.range(root, { index, min, max, offset, limit })` performs `Model.range({ index, min, max, offset, limit, properties: [ 'id' ] })`
- `Radredis.create(root, attrs)` performs `Model.create(attrs)`
- `this.attr(name)` returns a Promise that resolves to the value specified
- `this._id` returns the current id
- `this._update(attrs)` performs `Model.update(this._id, attrs)` on the instance, and mutates `this.attrs`
- `this._delete()` performs `Model.delete(this._id)` on the instance
