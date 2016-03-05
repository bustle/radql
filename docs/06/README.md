# 06. Static Methods

As the complexity of our application grows, we'll notice more and more repeated logic that we'll want generalize.

What if we wanted to create a new `Person`?

We could create a new mutation in `api.js` that describes the process for adding a person to the store, however,
this introduces duplication if we need to be able to create a `Person` from multiple `APIs`.

In order to co-locate our `Person.create` with the rest of `Person`, we introduce a notation of static fields and mutations
that can be called from our executor. We call these methods Type Services.

```js
// ... types/person.js

class Person extends RadType {

  // ...

  @ mutation("Person")
  @ args({ name: "string!", age: "integer", knows: [ "string" ] })
  static create(root, { name, age, knows: k = [] }) {
    // check that person does not exist
    if (people[name])
      throw new Error("That name is already taken!")
    // create person POJO
    const person = { name, age }
    // resolve KNOWS relationships
    k.forEach(other => knows[other].push(name))
    // Save to store
    people[name] = person
    knows[name] = k
    // return new person
    return new this(root, { person })
  }


  // ...

}

export default Person
```

Note that `get` is really just a mandatory Type Service with a special name, and can be annotated as such for self-documenting code.

We can now expose our `create` method in our API:

```js
// ... api.js

class API extends RadAPI {

  // ...

  @ mutation("Person")
  @ args({ name: "string!", age: "integer", knows: [ "string" ] })
  createPerson({ name, age, knows }) {
    return this.e$.Person.create({ name, age, knows })
  }

}

export default API
```

### Create Person Query

We should know be able to perform the following query

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
<a href="http://localhost:3000/graphql?query=mutation%20{%0A%20%20API__createPerson%28name%3A%20%22trent%22%2C%20age%3A%2021%2C%20knows%3A%20[%22daria%22%2C%20%22jane%22]%29%20{%0A%20%20%20%20name%0A%20%20%20%20age%0A%20%20%20%20knows%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
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
          "name": "daria",
          "age": 17
        },
        {
          "name": "jane",
          "age": 17
        }
      ]
    }
  }
}
```

### Side Effects

We should also notice that it performed the desired side effects, such as creating the inverse `knows` relationships

```graphql
{
  API {
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
<a href="http://localhost:3000/graphql?query={%0A%20%20API%20{%0A%20%20%20%20person%28name%3A%20%22daria%22%29%20{%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20age%0A%20%20%20%20%20%20knows%20{%0A%09%09%09%09name%0A%20%20%20%20%20%20%20%20age%0A%20%20%20%20%20%20}%0A%20%20%20%20}%0A%20%20}%0A}" target="_blank">
 [ Execute this query via GraphiQL ]
</a>
```json
{
  "data": {
    "API": {
      "person": {
        "name": "daria",
        "age": 17,
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
            "age": 21
          }
        ]
      }
    }
  }
}
```
