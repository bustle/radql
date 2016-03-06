import _       from 'lodash'
import Promise from 'bluebird'
import Redis   from 'ioredis'

import { RadService } from '../utils/types'

import { fetch
       , description
       , args
       } from '../utils/decorators'

export default function(opts) {

  class Source extends RadService {

    static opts = opts

    constructor(root) {
      super(root)
      // instantiate new redis connection
      this.redis = new Redis(opts)
    }

    _fetch(jobs, opts, n) {
      // consolidate attr jobs:
      const j = _(jobs)
        .groupBy('req.obj')
        .map
          ( (js, obj) =>
            ( { req: { op: `hmget`
                     , args: [obj, _.map(js, 'req.attr')]
                     }
              , resolve: vals => _.forEach(js, (job, i) => job.resolve(vals[i]))
              , reject:  err  => _.forEach(js,  job     => job.reject(err))
              }
            )
          )
        .value()
      // create updated jobs
      jobs = _(jobs)
        .filter(job => !(job.req.obj))
        .concat(j)
        .value()
      // build pipeline
      const p = this.redis.pipeline()
      _.forEach
        ( jobs
        , j => p[j.req.op](... j.req.args)
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
    }

    @ fetch
    from (m, from, { limit = 30, offset = 0 } = {}) {
      return { op: 'lrange'
             , args: [ `${m}:${from}`, offset, offset+limit-1 ]
             }
    }

    @ fetch
    find (m, from, to, { limit = 30, offset = 0 } = {}) {
      return { op: `zrevrange`
             , args: [ `${m}:${from}:${to}` ]
             }
    }

    @ fetch
    check (m, from, to, time) {
      return { key: `${m}:${from}:${to}:${time}`
             , op: `zscore`
             , args: [`${key}:${time}`, time]
             }

    }

    @ fetch
    attr (m, from, to, time, attr) {
      return { key: `${m}:${from}:${to}:${time}:${attr}`
             , obj: `${m}:${from}:${to}:${time}`
             , attr
             }

    }

  }

  Object.defineProperty(Source, 'name', { value: opts.name || 'Radgraph' })

  return Source

}
