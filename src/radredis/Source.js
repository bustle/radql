import _       from 'lodash'
import Promise from 'bluebird'
import Redis   from 'ioredis'

import { fetch
       , description
       , args
       } from '../utils/decorators'

import { RadService } from '../utils/types'

export default function(opts) {

  class Source extends RadService {

    static opts = opts
    static key = opts.name || 'Radredis'

    constructor(root) {
      super(root)
      // instantiate redis connection
      this.redis = new Redis(opts)
    }

    _fetch(jobs, opts, n) {
      //console.time(`FETCH #${n}`)
      //console.time(`GROUPING #${n}`)

      // group jobs by object
      jobs = _.map
        ( _.groupBy(jobs, 'req.item')
        , (l, item) =>
            ( { req: { item , props: _.map(l, 'req.prop') }
              , resolve: vals => _.forEach(l, (job, i) => job.resolve(vals[i]))
              , reject: err => _.forEach(l, (job, i) => job.reject(err))
              }
            )
        )

      //console.timeEnd(`GROUPING #${n}`)
      //console.log(`fetching job ${n} with ${jobs.length} jobs`)

      // build pipeline
      const p = this.redis.pipeline()
      _.forEach
        ( jobs
        , j => p.hmget(`${j.req.item}:attributes`, j.req.props)
        )

      // execute pipeline
      p.exec()
        .map(([err, val], i) => {
          const job = jobs[i]
          if (err)
            job.reject(err)
          else
            job.resolve(val)
        })
        //.then(() => console.timeEnd(`FETCH #${n}`))
    }

    @ fetch("string")
    prop({ m, id, prop }) {
      return { key: `${m}:${id}:${prop}`
             , item: `${m}:${id}`
             , prop
             }
    }

  }

  // define name attribute
  Object.defineProperty(Source, 'name', { value: Source.key })

  return Source

}
