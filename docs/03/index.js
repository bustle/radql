import express from 'express'
import gqlHTTP from 'express-graphql'
import RadQL   from '../../src'

import Counter from './apis/counter'
import Person  from './apis/person'

const APIs =
  [ Counter
  , Person
  ]

const { RootValue
      , schema
      , serve
      } = RadQL(APIs)

process.argv.forEach(v => {

  if (v !== '--express') return

  const app = express()

  app.use ( '/graphql'
          , gqlHTTP
            ( r =>
                ( { schema
                , rootValue: RootValue(r)
                , graphiql: true
                } )
            )
          )

  const server = app.listen(3000, () => {
    const port = server.address().port
    console.log(`RadQL listening at http://localhost:${port}`)
  })
})

export { serve }
