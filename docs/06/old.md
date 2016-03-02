For example, what if we want to be able to create new instances of `Person` other than the 3 we've hard-coded?
Although we could implement this as a set of static methods on `Person`, this can quickly get out of hand
with recursive data types mutually requiring each other.

Consider for example, a graph consisting of `USER` and `POST` where multiple `USER` instances can contribute to a `POST` instance.

```
+------------+         +-----------+
| USER       |         | POST      |
+------------+         +-----------+
| name       |         | content   |
| posts      |         | authors   |
+------------+         +-----------+
```

Adding a new post under a user will most likely require calling the `POST.create` method, creating a dependency:

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

To resolve this, we split the responsibilities of the `USER` and `POST` model into the data type, and the service
which executes side effects and retrieves raw data:

```
+---------+---------+
|  USER   |  POST   |
|  TYPE   |  TYPE   |
+--*---*--+--*---*--+
   |    \   /    |   
   |     \ /     |   
   |      \      |   
   |     / \     |   
   |    /   \    |   
+--V---V--+--V---V--+
|  USER   |  POST   |
| SERVICE | SERVICE |
+---------+---------+
```

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

No layer contains information about it's parents or its siblings, although all layers can send *instructions* to the root executor regarding the next step of execution.

Let's demonstrate this with a `PersonService` that manages the global state of our people:

```js
```

Notice that `PersonService` never returns a `Person`. It only ever returns the name of a person, or the underlying POJO representation of a person.
