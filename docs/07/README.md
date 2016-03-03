# 07. Standalone Services

# TODO: make this section not suck, just skip it honestly...

What if we want to allow mutations on the `knows` relationship?
It would be cumbersome to keep adding more methods onto the `Person` type,
and the method would not generalize to more complicated relationships between types.

Consider for example, a graph consisting of `USER` and `POST` where multiple `USER` instances can contribute to a `POST` instance.

```
+------------+         +-----------+
| USER       |         | POST      |
+------------+         +-----------+
| name       |         | content   |
| posts      |         | authors   |
+------------+         +-----------+
```

Adding a new `post` to a user requires mutating the `POST.update` store to accomodate the inverse relationship

```
+------------+         +-----------+
| USER       |      ---> POST      |
+------------+     /   +-----------+
| name       |    /    | content   |
| posts      *---/     | authors   |
+------------+         +-----------+
```

However, adding a contributor to a `POST` will most likely require calling some sort of `USER.update` method, creating a circular dependency:

```
+------------+         +-----------+
| USER       <--\   ---> POST      |
+------------+   \ /   +-----------+
| name       |    /    | content   |
| posts      *---/ \---* authors   |
+------------+         +-----------+
```

We could try to fix this by asserting that relationships will only ever be handled on one end, but this becomes difficult to manage as we add more types.

To resolve this, we create a standalone `CONTRIBUTION` service that both `USER` and `POST` sit on top of


```
+--------+--------+
|  USER  |  POST  |
|  TYPE  |  TYPE  |
+----*---+---*----+
     |       |       
     |       |       
+----V-------V----+
| CONTRIBUTION    |
| SERVICE         |
+-----------------+
```

Note that this contribution service does not need to know anything about `USER` or `POST`, just that they exist and it must maintain a relationship between the two.

The architecture of a `RadQL` server then becomes:

```
+----------------+
| RadQL Executor <--+
+-------V--------+  |
| APIs           *--+
+-------V--------+  |
| Data Types     *--+
+-------V--------+  |
| Services       *---
+-------V--------+
| External Libs  |
+----------------+
```

All layers can send a message back up to the executor, but know layer knows about itself or its siblings.

In the previous section we introduced the concept of service directives attached to static methods of our types.
Let's generalize the concept of a service directive to a full standalone service class.
We will write a `Store` service that manages our in-memory representations of `Person` and the `knows` relationship:

```js
// store.js

import { field
       , mutation
       , args
       , description
       , RadService
       } from 'radql'

// in-memory store
const store =

  { people:
    { "daria":
      { name: "daria"
      , age: 17
      }
    , "jane":
      { name: "jane"
      , age: 17
      }
    , "quinn":
      { name: "quinn"
      , age: 15
      }
    }

  , knows:
    { daria: [ "jane", "quinn" ]
    , jane: [ "daria" ]
    , quinn: [ "daria" ]
    }
  }

// store service
class Store extends RadService {

  @ field("object")
  @ args({ type: "string!", name: "string!" })
  @ description("Retrieves an object from the store")
  getObject({ type, name }) {
    return store[type][name]
  }

  @ mutation("object")
  @ args({ type: "string!", name: "string!", payload: "string!" })
  @ description("Adds an object to the store")
  addObject({ type, name, payload }) {
    if (store[type][name])
      throw new Error("Name already taken!")
    return store[type][name] = payload
  }

  @ mutation([ "string" ])
  @ args({ type: "string!", from: "string!" })
  @ description("Retrieves adjacencies from the store")
  getEdges({ type, from }) {
    return store[type][from] || []
  }

  @ mutation("string")
  @ args({ type: "string!", inv: "string", from: "string!", to: "string!" })
  @ description("Add an adjacency and its inverse, returns parent key")
  addEdge({ type, inv, from, to }) {
    // get forward adjacency list
    const f = store[type][from] = store[type][from] || []
    // insert edge if it doesn't exist
    if (!~f.indexOf(to)) f.push(to)
    // check if inverse type is provided
    if (inv) {
      // get backward adjacency list
      const b = store[inv][to] = store[inv][to] || []
      // insert edge if it doesn't exist
      if (!~b.indexOf(from)) b.push(from)
    }
    return from
  }

}

export default Store
```

Now after we register our service with RadQL...

```js
// ... index.js

import Store   from './store'

const Services =
  [ Store
  ]

const rql = RadQL([ API ], Types, Services)

// ...
```

... we will be able to shift a lot of our logic from the service directives and mutations of `Person` into the `Store` service.

```js
// ... types/person.js

class Person extends RadType {

  // ...

  @ service("Person")
  @ args({ name: "string!" })
  static get(root, { name }) {
    const Store = root.e$.Store
    const person = Store.getObject({ type: "people", name })
    return person && new this(root, { person })
  }

  @ service("Person")
  @ args({ name: "string!", age: "integer", knows: [ "string" ] })
  static create(root, { name, age, knows = [] }) {
    const Store = root.e$.Store
    // create person POJO
    const person = { name, age }
    Store.addObject({ type: "people", name, payload: person })
    // resolve KNOWS relationships
    knows.forEach
      ( to =>
          Store.addEdge({ type: "knows", inv: "knows", from: name, to })
      )
    // return new person
    return new this(root, { person })
  }

  // ...

  @ field([ "Person" ])
  @ description("List of people known by the specified person")
  knows() {
    const { e$, me } = this
    return e$.Store.getEdges({ type: "knows", from: me.name })
      .map(name => e$.Person({ name }))
  }

  // ...

  @ mutation("Person")
  @ args({ other: "string!" })
  @ description("Add a KNOWS relationship")
  meet({ other }) {
    const { e$, me } = this
    e$.Store.addEdge({ type: "knows", inv: "knows", from: me.name, to: other })
    return this
  }

}

export default Person
```

Now, instead of talking to the store directly, we run commands on `e$.Store`.

Now we can expose our new mutation in our API:

```js
// ... api.js

class API extends RadAPI {

  // ...

  @ mutation("Person")
  @ args({ name: "string!", other: "string!" })
  meet({ name, other }) {
    return this.e$.Person({ name })
      .then(p => p.meet({ other }))
  }

}

export default API
```

### `meet` Mutation

We can now perform the `meet` mutation:

```graphql
mutation {
      API__createPerson(name: "trent", age: 21, knows: ["daria", "jane"]) {
        name
        age
        knows {
          name
          age
        }
      }
    }
```
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20API__createPerson%28name%3A%20%22trent%22%2C%20age%3A%2021%2C%20knows%3A%20[%22jane%22]%29%20{%0A%20%20%20%20name%0A%20%20%20%20age%0A%20%20%20%20knows%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20}%0A%20%20}%0A%20%20API__meet%28name%3A%20%22daria%22%2C%20other%3A%20%22trent%22%29%20{%0A%20%20%20%20name%0A%20%20%20%20age%0A%20%20%20%20knows%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API__createPerson": {
      "name": "trent",
      "age": 21,
      "knows": [
        {
          "name": "jane",
          "age": 17
        }
      ]
    },
    "API__meet": {
      "name": "daria",
      "age": 17,
      "knows": [
        {
          "name": "jane"
        },
        {
          "name": "quinn"
        },
        {
          "name": "trent"
        }
      ]
    }
  }
}
```

### Inverse Relationship Check

And since our `Store.addEdge` method handles inverse edges, `jane` should know `trent` and `trent` should know `daria`

```graphql
{
  API {
    jane: person(name: "jane") {
      name
      knows {
        name
      }
    }
    trent: person(name: "trent") {
      name
      knows {
        name
      }
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20jane%3A%20person%28name%3A%20%22jane%22%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20knows%20{%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20%20%20trent%3A%20person%28name%3A%20%22trent%22%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20knows%20{%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "jane": {
        "name": "jane",
        "knows": [
          {
            "name": "daria"
          },
          {
            "name": "trent"
          }
        ]
      },
      "trent": {
        "name": "trent",
        "knows": [
          {
            "name": "jane"
          },
          {
            "name": "daria"
          }
        ]
      }
    }
  }
}
```
