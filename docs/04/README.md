# 04. Data Types

`RadAPI` is actually a specific instance of the more general `RadType`.
So far, our APIs have only been concerned with a single object, most real requests will involve multiple objects.

First, let's generalize turn our `Counter` and `Person` APIs into types.
This is as simple as `s/RadAPI/RadType`:

```js
// types/counter.js

import { field
       , mutation
       , args
       , description
       , RadType
       } from 'radql'

let value = 0
let mods = []

class Counter extends RadType {

  static description = "A simple counter"

  // ...

}

export default Counter
```

However, recall that our `Person` API throws an error in the constructor if a person is not found.
Let's, instead, create a `Person` factory that returns a `Person` if they exist, and `null`
(the standard GraphQL value for an object that doesn't exist, like the `Nothing` constructor in many functional languages)

```js
// types/person.js

import { field
       , mutation
       , args
       , description
       , RadType
       } from 'radql'

// ...

// person implementation
class Person extends RadType {

  static description = "A simple person"
  static args = { name: "string!" }

  static get(root, { name }) {
    const person = people[name]
    return person && get this(root, { person })
  }

  constructor(root, { person }) {
    super(root)
    this.me = person
  }

  // ...

}

export default Person
```

The `RadQL` executor actually calls the static `get` method to instantiate an instance of a type/API.
Our constructor should be used just for initializing fields of our object, while the `get` method is where we place our validation logic.

We now create a new API that exposes both of our types:

```js
// api.js

import { field
       , mutation
       , args
       , description
       , RadAPI
       } from 'radql'

class API extends RadAPI {

  static description = "Our Fun API"

  @ field("Counter")
  @ description("Returns the counter instance")
  counter() {
    return this.e$.Counter()
  }

  @ field("Person")
  @ args({ name: "string!" })
  @ description("Finds a person by name")
  person({ name }) {
    return this.e$.Person({ name })
  }

  @ mutation("integer")
  @ description("Increment our counter by 1")
  incrementCounter() {
    return this.e$.Counter()
      .then(c => c.increment({ amount: 1 }))
  }

  @ mutation("integer")
  @ args({ name: "string!" })
  @ description("Increment a person's age by 1")
  birthday({ name }) {
    return this.e$.Person({ name })
      .then(p => p.birthdays({ num: 1 }))
  }

}

export default API
```

Notice that our methods use `this.e$`.
All `RadAPI` and `RadType` instances contain a reference to `e$`, which is the current execution context.
This will become very useful when we explore the concept of batching execution, as `e$` is a per-request singleton,
however for now we're using it to call our factory methods.

Note that `this.e$[TypeName](args)` isn't quite the same as calling `Type.get(args)`.
`e$` also implements memoization for resource sharing and other features for efficiency.
This will be explained in greater detail later on in this tutorial when we begin creating data sources
and explain the full semantics of RadQL factories.

We now mount our new API and types:

```js
// ... index.js

import API     from './api'

import Counter from './types/counter'
import Person  from './types/person'

const Types =
  [ Counter
  , Person
  ]

const rql = RadQL([ API ], Types)

// ...
```

Since `Counter` and `Person` are now mounted as `Types` and not `APIs`, they will not be exposed in the root query object. We can only access them through `API`.
This allows us to restrict which records we can get and which mutations we can perform depending on the API context.
Notice that we only allow incrementing by 1 in this API.

### Basic Query

```graphql
{
  API {
    counter {
      value
    }
    person(name: "daria") {
      age
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20counter%20{%0A%20%20%20%20%20%20value%0A%20%20%20%20}%0A%20%20%20%20person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20%20%20age%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "counter": {
        "value": 0
      },
      "person": {
        "age": 17
      }
    }
  }
}
```

### Basic Mutations

```graphql
mutation {
  i1: API__incrementCounter
  i2: API__incrementCounter
  i3: API__incrementCounter
  daria: API__birthday(name: "daria")
  jane: API__birthday(name: "jane")
}
```
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20i1%3A%20API__incrementCounter%0A%20%20i2%3A%20API__incrementCounter%0A%20%20i3%3A%20API__incrementCounter%0A%20%20daria%3A%20API__birthday%28name%3A%20%22daria%22%29%0A%20%20jane%3A%20API__birthday%28name%3A%20%22jane%22%29%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "i1": 1,
    "i2": 2,
    "i3": 3,
    "daria": 18,
    "jane": 18
  }
}
```

### Instance Resolution

Notice that querying `person(name: "trent")` returns a null object instead of throwing an error

```graphql
{
  API {
    counter {
      value
      mod
      fourth: mod(offset: 3)
    }
    daria: person(name: "daria") {
      name
      age
    }
    trent: person(name: "trent") {
      name
      age
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20counter%20{%0A%20%20%20%20%20%20value%0A%20%20%20%20%20%20mod%0A%20%20%20%20%20%20fourth%3A%20mod%28offset%3A%203%29%0A%20%20%20%20}%0A%20%20%20%20daria%3A%20person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20}%0A%20%20%20%20trent%3A%20person%28name%3A%20%22trent%22%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "counter": {
        "value": 3,
        "mod": 1456948025749,
        "fourth": null
      },
      "daria": {
        "name": "daria",
        "age": 18
      },
      "trent": null
    }
  }
}
```
