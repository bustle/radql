# 07. Standalone Services

What if we want to add persistence to our server?
We could put I/O in each of our classes, but then our code starts to become convoluted.

Instead, let's create a `Store` service that handles all of our state.
Unlike a data type, a service is a singleton and is not reflected in the GraphQL schema.
A service's sole responsibility is to perform jobs, such as I/O or heavy computations, for the data types.

First let's create our `services/store.json` which holds our data:

```json
{
  "value": 0,
  "mods": [],
  "person__daria": {
    "name": "daria",
    "age": 17
  },
  "person__jane": {
    "name": "jane",
    "age": 17
  },
  "person__quinn": {
    "name": "quinn",
    "age": 15
  },
  "knows__daria": [
    "jane",
    "quinn"
  ],
  "knows__jane": [
    "daria"
  ],
  "knows__quinn": [
    "daria"
  ]
}
```

Notice that our store is just a flat key-value pair. We will be using the same `Store` service for both our `Counter` and `Person` type.

```js
// services/store.js

import path from 'path'
import fs from 'fs'

import { field
       , mutation
       , args
       , description
       , RadService
       } from 'radql'

const store = path.join(__dirname, 'store.json')

// reads contents of data store
function read() {
  return new Promise((resolve, reject) => {
    fs.readFile(store, (err, data) => {
      if (err)
        rejeect(err)
      else
        resolve(JSON.parse(data))
    })
  })
}

// writes contents to data store, resolves "ret" as return value
function write(data, ret) {
  return new Promise((resolve, reject) => {
    fs.writeFile(store, JSON.stringify(data), (err) => {
      if (err)
        reject(err)
      else
        resolve(ret)
    })
  })
}

class Store extends RadService {

  static description = "Data store"

  @ field("object")
  @ args({ key: "string!" })
  @ description("Retrieves an object from the store")
  get({ key }) {
    return read()
      .then(data => data[key])
  }

  @ mutation("object")
  @ args({ key: "string!", value: "object!" })
  @ description("Modifies a value in the store")
  set({ key, value }) {
    return read()
      .then(data => {
        data[key] = value
        return write(data, value)
      })
  }

  @ mutation("object")
  @ args({ key: "string!", value: "object!" })
  @ description("Pushes object to array in store")
  push({ key, value }) {
    return read()
      .then(data => {
        data[key].push(value)
        return write(data)
          .then(() => data[key])
      })
  }
}

export default Store
```

For brevity, we forgo any kind of validations on the `Store` level,
however in a real application we will probably want to create more specific methods such as
`insert` and `update` that perform validations.

Also note that our current implementation is horribly inefficient, we will resolve performance concerns in the next section.

We can now modify our `Counter` type to use the new `Store` service, by making calls to `e$.Store.get({ key })` and `e$.Store.set({ key, value })`:

```js
// ... types/counter.js

class Counter extends RadType {

  static description = "A simple counter"

  @ field("integer")
  @ description("The current value of the counter")
  value() {
    return this.e$.Store.get({ key: 'value' })
  }

  @ field("number")
  @ args({ offset: "integer" })
  @ description("The time of last modification")
  mod({ offset = 0 } = {}) {
    return this.e$.Store.get({ key: 'mods' })
      .then(mods => mods[mods.length - offset - 1])
  }

  @ mutation("integer")
  @ args({ amount: "integer!" })
  @ description("Increment a counter by a given amount")
  increment({ amount }) {
    const Store = this.e$.Store
    return Store.push({ key: 'mods', value: +Date.now() })
      .then(() => Store.get({ key: 'value' }))
      .then(value => Store.set({ key: 'value', value: value + amount }))
  }

}

export default Counter
```

We can modify our `Person` type similarly:

```js
// ... types/person.js

class Person extends RadType {

  static description = "A simple person"

  constructor(root, person) {
    super(root)
    this.me = person
  }

  @ field("Person")
  @ args({ name: "string!" })
  static get(root, { name }) {
    return root.e$.Store.get({ key: `person__${name}` })
      .then(person => new this(root, person))
  }

  // ...

  @ field([ "Person" ])
  @ description("List of people known by the specified person")
  knows() {
    const { e$, me } = this
    return e$.Store.get({ key: `knows__${me.name}` })
      .then(names => names.map(name => e$.Person({ name })))
  }

  @ mutation("Person")
  @ args({ name: "string!", age: "integer", knows: [ "string" ] })
  static create(root, { name, age, knows = [] }) {
    const Store = root.e$.Store
    const person = { name, age }
    return knows
      // resolve KNOWS relationships sequentially
      .reduce
        ( (prev, curr) =>
            prev.then( () => Store.push({ key: `knows__${curr}`, value: name }) )
        , Promise.resolve()
        )
      // create KNOWS relationship for new person
      .then(() => Store.set({ key: `knows__${name}`, value: knows }))
      // save new person to store
      .then(() => Store.set({ key: `person__${name}`, value: person }))
      // return new person
      .then(() => new this(root, person))
  }

  @ mutation("integer")
  @ args({ num: "integer" })
  @ description("Increase age by \"num\" (default 1)")
  birthdays({ num = 1 } = {}) {
    const { e$, me } = this
    me.age += num
    return e$.Store.set({ key: `person__${me.name}`, value: me })
      .then(() => me.age)
  }

}

export default Person
```

The same queries as in the previous sections should work.

### Test Mutations

```graphql
mutation {
  i1: API__incrementCounter
  i2: API__incrementCounter
  i3: API__incrementCounter
  API__createPerson(name: "trent", age: 20, knows: [ "jane", "daria" ]) {
    name
    age
    knows {
      name
      age
    }
  }
  API__birthday(name: "daria")
}
```
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20i1%3A%20API__incrementCounter%0A%20%20i2%3A%20API__incrementCounter%0A%20%20i3%3A%20API__incrementCounter%0A%20%20API__createPerson%28name%3A%20%22trent%22%2C%20age%3A%2020%2C%20knows%3A%20[%20%22jane%22%2C%20%22daria%22%20]%29%20{%0A%20%20%20%20name%0A%20%20%20%20age%0A%20%20%20%20knows%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20}%0A%20%20}%0A%20%20API__birthday%28name%3A%20%22daria%22%29%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "i1": 1,
    "i2": 2,
    "i3": 3,
    "API__createPerson": {
      "name": "trent",
      "age": 20,
      "knows": [
        {
          "name": "jane",
          "age": 17
        },
        {
          "name": "daria",
          "age": 17
        }
      ]
    },
    "API__birthday": 18
  }
}
```

### Test Query

This query should still return the same value even after restarting the server.

```graphql
{
  API {
    counter {
      value
      mod(offset: 2)
    }
    person(name: "daria") {
      name
      age
      knows {
        name
        age
      }
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20counter%20{%0A%20%20%20%20%20%20value%0A%20%20%20%20%20%20mod%28offset%3A%202%29%0A%20%20%20%20}%0A%20%20%20%20person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20%20%20knows%20{%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20age%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "counter": {
        "value": 3,
        "mod": 1457031650582
      },
      "person": {
        "name": "daria",
        "age": 18,
        "knows": [
          {
            "name": "jane",
            "age": 17
          },
          {
            "name": "quinn",
            "age": 15
          },
          {
            "name": "trent",
            "age": 20
          }
        ]
      }
    }
  }
}
```
