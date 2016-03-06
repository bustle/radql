import express from 'express'
import gqlHTTP from 'express-graphql'
import RadQL   from '../../src'

import API     from './api'

import Band    from './types/band'
import Counter from './types/counter'
import Person  from './types/person'

const Types =
  [ Band
  , Counter
  , Person
  ]

import Store    from './services/store'
import Radredis from './services/radredis'
import Radgraph from './services/radgraph/source'
import Likes    from './services/radgraph/likes'

const Services =
  [ Store
  , Radredis
  , Radgraph
  , Likes
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

// reset for tests

import Promise from 'bluebird'
import path from 'path'
import fs from 'fs'

export function reset() {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, 'services/fixtures.json'), (e1, data) => {
      fs.writeFile(path.join(__dirname, 'services/store.json'), data, (e2) => {
        return (e1 || e2)
          ? reject(e1 || e2)
          : resolve()
      })
    })
  }).then(() => {
    const { e$ } = RootValue()
    return e$.Radredis.redis.flushdb()
  })
}
