# 11. Radgraph Edges

Radgraph integration also comes bundled with a Type constructor for creating data types which represent associations.

It's typically easier to reason about models in which Radgraph is used purely for associations with no data associated,
however, since each association is itself a primary key, utilizing data attributes of associations can be more efficient than using an intermediary data structure.

Let's created a `Loves` association where a `Person` can assign a nickname and personal ranking to a `Band`:

```js
// sources/radgraph/loves.js

import { Service } from 'radql/lib/radgraph'
import source from './source'

const schema =
  { name: "Loves"
  , inverse: "LovedBy"
  , from: "Person"
  , to: "Band"
  , properties:
    { nickname: { type: "string" }
    , rank: { type: "integer" }
    }
  }

export default Service(source, schema)
```

We can now create a `Loved` type which reflects a `Loves` association:

```js
// types/loved.js

import { field
       , mutation
       , args
       , description
       , service
       } from 'radql'

import { Type } from 'radql/lib/radgraph'

import Loves from '../services/radgraph/loves'

const RadgraphType = Type(Loves, { fromKey: 'name' })

class Loved extends RadgraphType {

  @ service
  static create(root, name, id, { nickname, rank }) {
    return root.e$.Loves
      .add(name, id, { nickname, rank })
      .then(edge => new this(root, edge))
  }

  @ field("Person")
  person() {
    return this.from
  }

  @ field("Band")
  band() {
    return this.to
  }

  @ field("string")
  nickname() {
    return this.attr('nickname')
  }

  @ field("integer")
  rank() {
    return this.attr('rank')
  }

}

export default Loved
```

Notice that for most associations doing `Type(Service)` would be sufficient.
If `{ fromKey, toKey }` are not provided, `Radgraph` assumes that the primary key is `id`.
However, in our case, the primary key for a `person` is called `name`, so we pass in a `fromKey` property into our second parameter.

The `Type` constructor uses this primary key name to generate the `.from` and `.to` properties of the prototype, which lazily evaluate to the models that the edge points to.

Notice that we wrote our own `create` service. The `Type` constructor does *not* come bundled with static methods, as the type constructor can be built from either an edge or its inverse.
It does, however, come with `._all()`, `._update()`, and `._delete()` methods which reflect their counterparts in the radredis type.

Let's expose a mutation for creating a `Loves` relationship in our API

```js
// ... api.js

class API extends RadAPI {

  // ...

  @ mutation("Loved")
  @ args({ name: "string!", id: "id!", nickname: "string", rank: "integer" })
  loveBand({ id, name, nickname, rank }) {
    return this.e$.Loved.create(name, id, { nickname, rank })
  }


}

export default API
```

And allow forward queries:

```js
// ... types/person.js

class Person extends RadType {

  // ...

  @ field([ "Loved" ])
  @ description("List of loved bands")
  loves() {
    const { e$, me } = this
    return e$.Loves
      .from(me.name, { limit: 0 })
      .map(e$.Loved)
  }

  // ...

}

export default Person
```

And backward queries:

```js
// ... types/band.js

class Band extends Radredis {

  // ...

  @ field([ "Loved" ])
  @ description("List of people who love this band")
  lovedBy() {
    const { e$, _id: id } = this
    return e$.Loves.inv
      .from(id, { limit: 0 })
      .map(e$.Loved)
  }

  // ...

}

export default Band
```

### Test Mutation

```graphql
mutation {
  l1: API__loveBand(name: "daria", id: 1, nickname: "trents ok") {
    band {
      name
    }
    nickname
  }
  l2: API__loveBand(name: "jane", id: 3, rank: 11) {
    band {
      name
    }
    rank
  }
}
```
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20l1%3A%20API__loveBand%28name%3A%20%22daria%22%2C%20id%3A%201%2C%20nickname%3A%20%22trents%20ok%22%29%20{%0A%20%20%20%20band%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20}%0A%20%20%20%20nickname%0A%20%20}%0A%20%20l2%3A%20API__loveBand%28name%3A%20%22jane%22%2C%20id%3A%203%2C%20rank%3A%2011%29%20{%0A%20%20%20%20band%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20}%0A%20%20%20%20rank%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "l1": {
      "band": {
        "name": "Mystik Spiral"
      },
      "nickname": "trents ok"
    },
    "l2": {
      "band": {
        "name": "Jane's Addition"
      },
      "rank": 11
    }
  }
}
```

### Test Query

```graphql
{
  API {
    person(name: "daria") {
      loves {
        nickname
        band {
          rank
        }
      }
    }
    band(id: 3) {
      name
      lovedBy {
        rank
      }
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20%20%20loves%20{%0A%20%20%20%20%20%20%20%20nickname%0A%20%20%20%20%20%20%20%20band%20{%0A%20%20%20%20%20%20%20%20%20%20rank%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20%20%20band%28id%3A%203%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20lovedBy%20{%0A%20%20%20%20%20%20%20%20rank%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "person": {
        "loves": [
          {
            "nickname": "trents ok",
            "band": {
              "rank": "9"
            }
          }
        ]
      },
      "band": {
        "name": "Jane's Addition",
        "lovedBy": [
          {
            "rank": 11
          }
        ]
      }
    }
  }
}
```

### Decorators

Notice however, that we still need to grab context from the `band` field, as our edges aren't necessarily complete.
We can implement decorator fields to take default values from the `from` or `of` fields:

```js
// ... types/loved.js

class Loved extends RadgraphType {

  // ...

  @ field("string")
  nickname() {
    return this.attr('nickname')
      .then(val => val || this.from.then(band => band.name()))
  }

  @ field("integer")
  rank() {
    return this.attr('rank')
      .then(val => val || this.from.then(band => band.rank()))
  }

}

export default Loved
```

```graphql
{
  API {
    daria: person(name: "daria") {
      loves {
        nickname
        rank
      }
    }
    jane: person(name: "jane") {
      loves {
        nickname
        rank
      }
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20daria%3A%20person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20%20%20loves%20{%0A%20%20%20%20%20%20%20%20nickname%0A%20%20%20%20%20%20%20%20rank%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20%20%20jane%3A%20person%28name%3A%20%22jane%22%29%20{%0A%20%20%20%20%20%20loves%20{%0A%20%20%20%20%20%20%20%20nickname%0A%20%20%20%20%20%20%20%20rank%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "daria": {
        "loves": [
          {
            "nickname": "trents ok",
            "rank": 9
          }
        ]
      },
      "jane": {
        "loves": [
          {
            "nickname": "Jane's Addition",
            "rank": 11
          }
        ]
      }
    }
  }
}
```

Decorating a promise is pretty cumbersome though, so `radql` implements a `@decorates` decorator because yo dawg I heard you like decorators:


```js
// ... types/loved.js

import { field
       // ...
       , decorates
       } from '../../../src'

// ...

class Loved extends RadgraphType {

  // ...

  @ field("string")
  @ decorates(function() {
      return this.to.then(band => band.name())
    })
  nickname() {
    return this.attr('nickname')
  }

  @ field("integer")
  @ decorates(function() {
      return this.to.then(band => band.rank())
    })
  rank() {
    return this.attr('rank')
  }

}

export default Loved
```

But this is even longer than our original code, so we introduce yet another piece of syntactic sugar which is the `@decorates` decorator in radgraph:

```js
// ... types/loved.js

import { Type, decorates } from 'radql/lib/radgraph'

// ...

class Loved extends RadgraphType {

  // ...

  @ field("string")
  @ decorates('to', 'name')
  nickname() {
    return this.attr('nickname')
  }

  @ field("integer")
  @ decorates('to', 'rank')
  rank() {
    return this.attr('rank')
  }

}

export default Loved
```

### TODO: Full docs
- `this.from`: lazily evaluated promise for the `from` end of the edge
- `this.to`: lazily evaluated promise for the `to` end of the edge
- `this.attr(name)`: retrieves a data attribute
- `this._fromKey`: from key
- `this._toKey`: to key
- `this._time`: time
- `this._all()`: strictly evaluates all data attributes (for partial updates)
- `this._update(attrs)`: updates self with new attributes
- `this._delete()`: deletes and returns self, note that data attributes will likely be null at this point, although `this.from`, `this.to`, and `this._time` should be fine
