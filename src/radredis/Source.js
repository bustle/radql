import _       from 'lodash'
import Promise from 'bluebird'
import Redis   from 'ioredis'

import { fetch
       } from '../utils/decorators'

import { RadService } from '../utils/types'

export default function(opts) {

  class Source extends RadService {

    static opts = opts

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
            ( { req: { item , attrs: _.map(l, 'req.attr') }
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
        , j => p.hmget(`${j.req.item}:attributes`, j.req.attrs)
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

    @ fetch
    attr(m, id, attr) {
      return { key: `${m}:${id}:${attr}`
             , item: `${m}:${id}`
             , attr
             }
    }

  }

  // define name attribute
  Object.defineProperty(Source, 'name', { value: opts.name || 'Radredis' })

  return Source

}
