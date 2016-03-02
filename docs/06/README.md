# 06. Statics

As the complexity of our application grows, we'll notice more and more repeated logic that we'll want generalize.

What if we wanted to create a new `Person`?

We could create a new mutation in `api.js` that describes the process for adding a person to the store, however,
this introduces duplication if we need to be able to create a `Person` from multiple `APIs`.

In order to co-locate our `Person.create` with the rest of `Person`, we introduce the `@ service(type)` decorator:

```js

```
