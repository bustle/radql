# 10. Radgraph Services

RadQL also comes bundled with Radgraph. Let's use it to create a `Likes` relationship from a `Person` to a `Band`:

### Source

To begin, we create a service that manages our connection to the `radredis` server:

```js
// sources/radgraph/source.js

import { Source } from 'radql/lib/radgraph'

const opts =
  { name: 'Radgraph'
  , db: 3
  }

export default Source(opts)
```

Like with Radredis, this will create a new service, `e$.Radgraph`, that must be registered,
although it is unlikely that you will ever need to call it yourself.

### Service

We create a schema for our `Likes` association. See the `radgraph` documentation for more information.
In this example, we will be using a simple association, although we will introduce associations with data attributes in the next section.

```js
// sources/radgraph/likes.js

import { Service } from 'radql/lib/radgraph'
import source from './source'

const schema =
  { name: "Likes"
  , inverse: "LikedBy"
  , from: "Person"
  , to: "Band"
  }

export default Service(source, schema)
```

It is uncommon to need to extend services, as delegation is always preferred over inheritance.
In the case of data types, the base class provides a partial prototype, but for services, any additional functionality
should be implemented as a service that delegates to the original through the executor.
The underlying implementation of the `Service` constructor delegates to the `source` service.

### Integration

We now mount our services as usual:

```js
// ... index.js

import Store    from './services/store'
import Radredis from './services/radredis'
import Radgraph from './services/radgraph/source'
import Likes    from './services/radgraph/likes'

const Services =
  [ Store
  , Radredis
  , Radgraph
  , Likes
  ]
```

We expose a `likeBand` mutation that creates a new association:

```js
// ... api.js

class API extends RadAPI {

  // ...

  @ mutation("Band")
  @ args({ name: "string!", id: "id!" })
  likeBand({ id, name }) {
    return this.e$.Likes.add(name, id)
      .then(edge => this.e$.Band({ id: edge.to }))
  }

}

export default API
```

We allow forward querying from the `Person` type:

```js
// types/person.js

import Promise from 'bluebird'

// ...

class Person extends RadType {

  // ...

  @ field([ "Band" ])
  @ description("List of bands the person likes")
  likes() {
    const { e$, me } = this
    return e$.Likes.from(me.name, { limit: 0 })
      .map(edge => e$.Band({ id: edge.to }))
  }

  // ...

}

export default Person
```


And we allow backwards querying from the `Band` type, since we enabled the inverse edge:

```js
// types/band.js

import Promise from 'bluebird'

// ...

class Band extends Radredis {

  // ...

  @ field([ "Person" ])
  @ description("List of people who like this band")
  likedBy() {
    const { e$, _id: id } = this
    return e$.Likes.inv
      .from(id, { limit: 0 })
      .map(edge => e$.Person({ name: edge.to }))
  }

  // ...

}

export default Band
```

Notice that our services return edge objects (without data attributes).
The responses look just as they would from radgraph, except for the lack of of a data field, which we will explain with lazy evaluation in the next section.
It is our responsibility to map the response to the corresponding type constructor, although it would be trivial to write a higher order service that did this for us.
The reason for this will be more apparent when we introduce Edge types.

### Test Mutation

```graphql
mutation {
  l1: API__likeBand(name: "daria", id: 1) {
    name
  }
  l2: API__likeBand(name: "daria", id: 2) {
    name
  }
  l3: API__likeBand(name: "jane", id: 3) {
    name
  }
}
```
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20l1%3A%20API__likeBand%28name%3A%20%22daria%22%2C%20id%3A%201%29%20{%0A%20%20%20%20name%0A%20%20}%0A%20%20l2%3A%20API__likeBand%28name%3A%20%22daria%22%2C%20id%3A%202%29%20{%0A%20%20%20%20name%0A%20%20}%0A%20%20l3%3A%20API__likeBand%28name%3A%20%22jane%22%2C%20id%3A%203%29%20{%0A%20%20%20%20name%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "l1": {
      "name": "Mystik Spiral"
    },
    "l2": {
      "name": "The Zon"
    },
    "l3": {
      "name": "Jane's Addition"
    }
  }
}
```

### Test Query

```graphql
{
  API {
    person(name: "daria") {
      name
      age
      likes {
        name
        genres
      }
    }
    band(id: 3) {
      name
      id
      likedBy {
        name
        age
      }
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20%20%20likes%20{%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20genres%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20%20%20band%28id%3A%203%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20likedBy%20{%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20age%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "person": {
        "name": "daria",
        "age": 17,
        "likes": [
          {
            "name": "The Zon",
            "genres": [
              "industrial"
            ]
          },
          {
            "name": "Mystik Spiral",
            "genres": [
              "post-alterna-grunge",
              "trance punk"
            ]
          }
        ]
      },
      "band": {
        "name": "Jane's Addition",
        "id": "3",
        "likedBy": [
          {
            "name": "jane",
            "age": 17
          }
        ]
      }
    }
  }
}
```

### TODO: Full docs on the Radgraph service

Let `Edge` be a regular Radgraph edge, and `e$[name]` be the corresponding Radgraph service:

- `e$[name].inv` is analogous to `Edge.inv`
- `e$[name].from(from, { limit, offset })` is analogous to `Edge.from(from, { limit, offset })`
- `e$[name].of(from)` is analogous to `Edge.of(from)`
- `e$[name].find(from, to, { limit, offset })` is analogous to `Edge.find(from, to, { limit, offset })`
- `e$[name].get(from, to, time)` is analogous to `Edge.get(from, to, time)`
- `e$[name].add(from, to, attrs)` delegates `Edge.add(from, to, attrs)`
- `e$[name].set(from, to, attrs)` delegates `Edge.set(from, to, attrs)`
- `e$[name].delete(from, to, time)` delegates `Edge.delete(from, to, time)`
- `e$[name].deleteAll(from)` delegates `Edge.deleteALl(from)`
