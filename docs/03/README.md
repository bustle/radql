# 03. API Contexts

Often, we want to perform some sort of context resolution on our API such as authentication.

Let's create a `Person` API that changes its context depending on the name you provide:

```js
// apis/person.js

import { field
       , mutation
       , args
       , description
       , RadAPI
       } from '../../../src'

// in-memory person store
let people =
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

// person implementation
class Person extends RadAPI {

  static description = "A simple person API"
  static args = { name: "string!" }

  constructor(root, { name }) {
    super(root)
    const person = people[name]
    if (!person)
      throw new Error("Person not found!")
    this.me = person
  }

  @ field("string")
  @ description("The name of the specified person")
  name() {
    return this.me.name
  }

  @ field("integer")
  @ description("The age of the specified person")
  age() {
    return this.me.age
  }

  @ mutation(integer")
  @ args({ num: "integer" })
  @ description("Increase age by \"num\" (default 1)")
  birthdays({ num = 1 } = {}) {
    return this.me.age += num
  }

}

export default Person
```

Notice that we assigned `this.me = person`.
Rather than initializing mutable internal state, we just initiate a reference to our global scope.
This is because GraphQL executions typically occur in parallel so local mutable state creates inconsistencies in our results.
Ensuring immutability ensures soundness of our results, and will become particularly useful later when we introduce caching.

We mount our API like before:

```js
// ... index.js

import Counter from './apis/counter'
import Person  from './apis/person'

const APIs =
  [ Counter
  , Person
  ]

// ...
```

### Basic Query

We should now be able to perform the following query:

```graphql
{
  Person(name: "daria") {
    name
    age
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20Person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20name%0A%20%20%20%20age%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "Person": {
      "name": "daria",
      "age": 17
    }
  }
}
```

### Contextual Mutations

**CAVEAT**: There should not be any collisions between the root `static args` of the type declaration
and the leaf `@ args()` of any individual mutations.

Notice that the `Person__birthdays` mutation also takes a `name` attribute.
What we really want to write is `Person(name: "daria") { birthdays(num: 2) }`.
Until support is added for nested mutations, `RadQL` will merge the arguments of
the `API` constructor with the arguments of the mutation.

```graphql
mutation {
  Counter__increment(amount: 5)
  daria: Person__birthdays(name: "daria", num: 2)
  jane: Person__birthdays(name: "jane")
  quinn: Person__birthdays(name: "quinn")
}
```
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20Counter__increment%28amount%3A%205%29%0A%20%20daria%3A%20Person__birthdays%28name%3A%20%22daria%22%2C%20num%3A%202%29%0A%20%20jane%3A%20Person__birthdays%28name%3A%20%22jane%22%29%0A%20%20quinn%3A%20Person__birthdays%28name%3A%20%22quinn%22%29%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "Counter__increment": 5,
    "daria": 19,
    "jane": 18,
    "quinn": 16
  }
}
```

### Parallel Queries

We can now run multiple API queries in parallel.
This comes in handy for resolving data requirements of nested routes in our front-end applications.
Rather than consolidating multiple queries, we can just execute a new top-level request for each layer of our route.


```graphql
{
  Counter {
    value
    mod
  }
  daria: Person(name: "daria") {
    name
    age
  }
  jane: Person(name: "jane") {
    name
  }
  quinn: Person(name: "quinn") {
    age
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20Counter%20{%0A%20%20%20%20value%0A%20%20%20%20mod%0A%20%20}%0A%20%20daria%3A%20Person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20name%0A%20%20%20%20age%0A%20%20}%0A%20%20jane%3A%20Person%28name%3A%20%22jane%22%29%20{%0A%20%20%20%20name%0A%20%20}%0A%20%20quinn%3A%20Person%28name%3A%20%22quinn%22%29%20{%0A%20%20%20%20age%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "Counter": {
      "value": 5,
      "mod": 1456945574138
    },
    "daria": {
      "name": "daria",
      "age": 19
    },
    "jane": {
      "name": "jane"
    },
    "quinn": {
      "age": 16
    }
  }
}
```
