# 08. Batching Execution (Solving the N+1 SELECTs Problem)

Our previous code was pretty inefficient, it constantly reads and writes the same file to the disk.
Take for example, a nested query:

```graphql
{
  API {
    person(name: "daria") { # 1 READ 
      age                   # |
      knows {               # 1 + N READS
        name                # .   | 
        knows {             # 1 + N + N^2 READS
          name              # .   .   |
          knows {           # 1 + N + N^2 + N^3 READS
            name            # .   .   .     |
          }
        }
      }
    }
  }
}
```

The number of reads scales linearly with the number of records we're retrieving, however,
there's no reason why we can't read both `jane` and `quinn` from the same file read after the first `knows` call.
The trouble is, given our current architecture, `jane` and `quinn` don't have any way of knowing that they're being evaluated in a `knows` context.

Instead of determining how to read our data from the type or service, let's introduce a new layer of abstraction on top of the file itself
that batches the `get`, `set`, and `push` commands:

```js
// ... services/store.js

class Store extends RadService {

  static description = "Data store"
  static key = "Store"

  // Executes a list of read/write commands
  _fetch(jobs) {
    return read() // read store
      .then(data => {
        // apply all mutations
        for (let i = 0; i < jobs.length; i++) {
          const { type, key, value } = jobs[i].req
          // apply SET request
          if (type === 'set')
            data[key] = value
          // apply PUSH request
          if (type === 'push')
            data[key].push(value)
        }
        // write changes to disk
        return write(data)
      })
      .then(data => {
        // resolve our promises
        for (let i = 0; i < jobs.length; i++) {
          const job = jobs[i]
          job.resolve(data[job.req.key])
        }
      })
  }

  _get({ key }) {
    return { src: this , type: "get" , key }
  }

  _set({ key, value }) {
    return { src: this, type: "set", key, value, busts: true }
  }

  _push({ key, value }) {
    return { src: this, type: "push", key, value, busts: true }
  }

  @ service("object")
  @ args({ key: "string!" })
  @ description("Retrieves an object from the store")
  get(args) {
    return this.e$.fetch( this._get(args) )
  }

  @ service("object")
  @ args({ key: "string!", value: "object!" })
  @ description("Modifies a value in the store")
  set(args) {
    return this.e$.fetch( this._set(args) )
  }

  @ service("object")
  @ args({ key: "string!", value: "object!" })
  @ description("Pushes object to array in store")
  push(args) {
    return this.e$.fetch( this._push(args) )
  }

}

export default Store
```

We begin by writing a `_fetch` method, whose job is to execute an array of promises.
RadQL's executor, `e$`, supports a method called `e$.fetch` which pushes a job to a queue
that gets dispatched at every layer of execution. This way, our query above only requires 4 reads.

**CAVEATS**: In the payload, `key` is a special field that is used for caching requests.
If `key` is present, results will be cached for future use, otherwise, the request is made indiscriminately.
Similarly, `busts` is a special field that tells our executor to run a request anyways, and replace the cached value.
The executor also contains methods for more fine-tuned cache control, although the caching mechanism should only be used for simple key-value relationships.
Indices and pagination should be handled without caching.

However, notice that each of our `get`, `set`, and `push` methods are just thin wrappers over `e$.fetch` to their respective private methods.
Since this is so common, `RadQL` implements syntactic sugar in the form of a `@ fetch(type)` decorator:

```js
// ... services/store.js

import { fetch
       // ...
       } from 'radql'

class Store extends RadService {

  // ...

  @ fetch("object")
  @ args({ key: "string!" })
  @ description("Retrieves an object from the store")
  get({ key }) {
    return { type: "get" , key }
  }

  @ fetch("object")
  @ args({ key: "string!", value: "object!" })
  @ description("Modifies a value in the store")
  set({ key, value }) {
    return { type: "set", key, value, busts: true }
  }

  @ fetch("object")
  @ args({ key: "string!", value: "object!" })
  @ description("Pushes object to array in store")
  push({ key, value }) {
    return { type: "push", key, value, busts: true }
  }

}

export default Store
```

The same queries as in the previous section should still work as expected,
however, since our `read` calls are collected and dispatched asynchronously,
the number of round trips we make now scales linearly:

```graphql
{
  API {
    person(name: "daria") { # 1 READ 
      age                   # |
      knows {               # 1 + 2 READS
        name                # .   | 
        knows {             # 1 + 2 + 1 READ (hits cache when retrieving people)
          name              # .   .   |
          knows {           # 1 + 2 + 1 + 0 READS (hit cache for all data)
            name            # .   .   .   |
          }
        }
      }
    }
  }
}
```
