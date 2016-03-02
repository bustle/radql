# 02. APIs

At the top of each query we specify which API we want to talk to.
An API is a special GraphQL type that serves as a root for a request.
This is the first node that is resolved when a request is made.

Let's write an API that keeps track of a counter:

```js
// apis/counter.js

import { field
       , mutation
       , args
       , description
       , RadAPI
       } from '../../../src'

let value = 0
let mods = []

class Counter extends RadAPI {

  static description = "A simple counter API"

  @ field("integer")
  @ description("The current value of the counter")
  value() {
    return value
  }

  @ field("number")
  @ args({ offset: "integer" })
  @ description("The time of last modification")
  mod({ offset = 0 } = {}) {
    return mods[mods.length - offset - 1]
  }

  @ mutation("integer")
  @ args({ amount: "integer!" })
  @ description("Increment a counter by a given amount")
  increment({ amount }) {
    mods.push(+Date.now())
    return value += amount
  }

}

export default Counter
```

Note that `mod` is of type `number` rather than `integer`.
GraphQL integers are implemented as signed 32 bit integers,
since millisecond timestamps exceed this upper bound we need to use the `number` type.
We now expose our API:

```js
// ... index.js
import Counter from './apis/counter'

const APIs =
  [ Counter
  ]

const rql = RadQL(APIs)
// ...
```

### Basic Query

We should now be able to perform the following query:

```graphql
{
  Counter {
    value
    mod
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20Counter%20{%0A%20%20%20%20value%0A%20%20%20%20mod%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "Counter": {
      "value": 0,
      "mod": null
    }
  }
}
```

### Mutation

We can also perform the specified mutation.
Notice that the mutation is named `Counter__increment` rather than being accessed through `Counter { increment }`.
The current `graphql-js` implementation only guarantees serial execution on the top level.
As such, all mutations will root-level mutation fields named `[ API Name ]__[ Mutation Name ]`.

```graphql
mutation {
  Counter__increment(amount: 5)
}
```
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20Counter__increment%28amount%3A%205%29%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "Counter__increment": 5
  }
}
```

### Query with Labels

In `GraphQL` we can attach a label to each field.
This is particularly useful for fields like `mod` where `mod` can take an `offset` argument.
Clearly then, `mod` and `mod(offset: 1)` will refer to different values:

```graphql
{
  Counter {
    value
    mod
    latest: mod(offset: 0)
    second: mod(offset: 1)
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20Counter%20{%0A%20%20%20%20value%0A%20%20%20%20mod%0A%20%20%20%20latest%3A%20mod%28offset%3A%200%29%0A%20%20%20%20second%3A%20mod%28offset%3A%201%29%0A%20%20}%0A}" target="_blank">
[ Execute this query via GraphiQL  ]
</a>
```json
{
  "data": {
    "Counter": {
      "value": 5,
      "mod": 1456939753223,
      "latest": 1456939753223,
      "second": null
    }
  }
}
```
