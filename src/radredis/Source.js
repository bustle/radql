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

    constructor(root) {
      super(root)
      // instantiate redis connection
      this.redis = new Redis(opts)
    }

    key = opts.name || 'Radredis'

    _fetch(jobs, opts) {
      const p = this.redis.pipeline()
      // build pipeline
      _.forEach
        ( jobs
        , j => p[j.req.op](... j.req.args)
        )
      p.exec()
        .map(([err, val], i) => {
          const job = jobs[i]
          if (err)
            job.reject(err)
          else
            job.resolve(val)
        })
    }

    @ fetch([ "id!" ])
    index({ m, index, limit, offset }) {
      return { op: 'zrevrange'
             , args: [ `${m}:indexes:${index}`
                     , offset
                     , offset + limit - 1
                     ]
             }
    }

    @ fetch([ "id!" ])
    range({ m, index, min, max, limit, offset }) {
      return { op: 'zrevrangebyscore'
             , args: [ `${m}:indexes:${index}`
                     , max
                     , min
                     , 'LIMIT'
                     , offset
                     , offset + limit - 1
                     ]
             }
    }

    @ fetch("object")
    get({ m, id, props }) {
      return { key: `${m}:${id}`
             , op: 'hmget'
             , args: [ `${m}:${id}:attributes`
                     , props
                     ]
             }
    }

    @ fetch("string")
    prop({ m, id, prop }) {
      return { key: `${m}:${id}:${prop}`
             , op: 'hget'
             , args: [ `${m}:${id}:attributes`
                     , prop
                     ]
             }
    }

  }

  // define name attribute
  Object.defineProperty(Source, 'name', { value: Source.key })

  return Source

}
