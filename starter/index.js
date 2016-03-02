import express from 'express'
import gqlHTTP from 'express-graphql'
import RadQL   from '../src'

import { field
       , description
       , RadAPI
       } from '../src'

class HelloWorld extends RadAPI {

  static description = "Hello World API"

  @ field("string")
  @ description("Returns \"world\"")
  hello() {
    return "world"
  }

}

const rql = RadQL([ HelloWorld ])

const app = express()

app.use ( '/graphql'
        , gqlHTTP
          ( r =>
              ( { schema:    rql.schema
                , rootValue: rql.RootValue(r)
                , graphiql:  true
                }
              )
          )
        )

const server = app.listen(3000, () => {
  const port = server.address().port
  console.log(`RadQL listening at http://localhost:${port}`)
})

export default rql.serve
