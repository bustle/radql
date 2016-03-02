# 05. Data Composition

Recall that, internally, there's no real difference between a `RadAPI` and a `RadType`.
Therefore, just like we used `this.e$.Person({ name })` to return a person from `API`,
we can use `this.e$.person({ name })` to return a person from any other `RadType` as well.

Let's create an adjacency list showing which of our people know each other:

```js
// ... types/person.js

// in-memory "knows" store
let knows =
  { daria: [ "jane", "quinn" ]
  , jane: [ "daria" ]
  , quinn: [ "daria" ]
  }

// person implementation
class Person extends RadType {

  // ...

  @ field([ "Person" ])
  @ description("List of people known by the specified person")
  knows() {
    const { e$, me } = this
    return knows[me.name]
      .map(name => e$.Person({ name }))
  }

  // ...

}

export default Person
```

### Deeply Nested Query

We can now perform deeply nested queries, such as figuring out who lies within 3 degrees of separation from `daria`:
Notice that our subselections on the `know` field are mapped to all people returned.

```graphql
{
  API {
    person(name: "daria") {
      name
      age
      knows {
        name
        age
        knows {
          name
          age
          knows {
            name
            age
          }
        }
      }
    }
  }
}
```
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20%20%20knows%20{%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20age%0A%20%20%20%20%20%20%20%20knows%20{%0A%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20age%0A%20%20%20%20%20%20%20%20%20%20knows%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20age%0A%20%20%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
  [ Execute this query via GraphiQL ]
</a>
```json
```

We can extend this same logic to describe all sorts of common relationships, such as a `User` authoring a `Post`.
Practical applications of data type composition will be explored in more detail when `Radgraph` is introduced.
