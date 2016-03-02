# 01. Getting Started

A starter package is provided in the `/starter/` directory. Copy the contents into the desired folder and run
This directory contains the things you need to get started, including a `package.json` with dev dependencies, and a `.babelrc`
that will allow you to make use of ES2016 features.

```bash
npm install
npm start
```

Alternatively, an implementations are provided in the `radql` repo:

```bash
git clone https://github.com/bustlelabs/radql
cd radql
npm install
npm run doc1
```

This should start an `express-graphql` server with `GraphiQL` enabled at [localhost:3000/graphql](http://localhost:3000/graphql)

<a href="http://localhost:3000/graphql?query={%0A%20%20HelloWorld%20{%0A%20%20%20%20hello%0A%20%20}%0A}" target="_blank">
[ Execute this query via GraphiQL ]
</a>
```graphql
{
  HelloWorld {
    hello
  }
}
```

```json
{
  "data": {
    "HelloWorld": {
      "hello": "world"
    }
  }
}
```
