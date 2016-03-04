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

This will create a new service, `e$.Radredis`, supporting queries `.index`, `.range`, `.get`, and `.prop`,
although it is very rare to need to talk to this service directly.

### Schema

```js
// types/band.js

const schema =
  { title: "Band"
  , properties:
    { name: { type: "string" }
    , rank: { type: "integer" }
    , genres: { type: "array" }
    , statement: { type: "string", lazy: true }
    }
  }
```

We create a schema for our `Band` type. See the `radredis` documentation for more information.
Note that we introduce a new property called `lazy`. `lazy` fields will only be fetched if asked for, and are accessed through `this.lazy(name)` rather than `this.attrs[name]`.

### Type

```js
// ... types/band.js

import { field
       , mutation
       , service
       , args
       , description
       , RadType
       } from '../../../src'

import { Type } from 'radql/lib/radredis'
import source from '../services/radredis'

// generate base class
const Radredis = Type(source, schema)

// Band type definition
class Band extends Radredis {

  @ service([ "Band" ])
  static all(root, args) {
    return Radredis.all(root, args)
      .map(attrs => new this(root, attrs))
  }

  @ service("Band")
  static create(root, args) {
    return Radredis.create(root, args)
      .then(attrs => new this(root, attrs))
  }

  @ field("id!")
  id() { return this.attrs.id }

  @ field("number!")
  created_at() { return this.attrs.created_at }

  @ field("string")
  @ description("Name of the band")
  name() { return this.attrs.name }

  @ field("string")
  @ description("Rank based on Pitchfork reviews")
  rank() { return this.attrs.rank }

  @ field([ "string" ])
  @ description("Genres the band identifies as")
  genres() { return this.attrs.genres }

  @ field("string")
  @ description("The band's artistic statement")
  statement() {
    return this.lazy('statement')
  }

}

export default Band
```

We declare a base class by running `Type(source, schema)`.
This will create an object which implements our constructor, and provides static helper methods such as
`Radredis.find`, `Radredis.all`, `Radredis.range`, and `Radredis.create`, as well as creating a prototype
such as `.attrs`, `.lazy` `._update` and `._delete`.

### TODO: Full documentation of Radredis API

Let `Model` be be a `Radredis` model, `Radredis` be the result of calling `Type(source, schema)`, and `this` an instance of the data type,
the following are anologous:

- `Radredis.find(root, { id })` performs `Model.find(id)`
- `Radredis.all(root, { index, offset, limit })`
- `Radredis.range(root, { index, min, max, offset, limit })`
- `Radredis.create(root, attrs)` performs `Model.create(attrs)`
- `this.attrs[name]` returns the value specified
- `this.lazy(name)` returns a Promise that resolves to the value specified
- `this._update(attrs)` performs `Model.update(this.attrs.id, attrs)` on the instance, and mutates `this.attrs`
- `this._delete()` performs `Model.delete(this.attrs.id)` on the instance

### TODO: auto-batch .prop calls in Source

Once this happens, every value will be lazy and life will be good.
