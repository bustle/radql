import express from 'express'
import gqlHTTP from 'express-graphql'
import RadQL   from '../../src'

import API     from './api'

import Counter from './types/counter'
import Person  from './types/person'

const Types =
  [ Counter
  , Person
  ]

import Store   from './store'

const Services =
  [ Store
  ]

const { RootValue
      , schema
      , serve
      } = RadQL([ API ], Types, Services)

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
