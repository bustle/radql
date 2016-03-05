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
    static key = opts.name || 'Radredis'

    constructor(root) {
      super(root)
      // instantiate new redis connection
      this.redis = new Redis(opts)
    }

    _fetch(jobs, opts, n) {

      // build pipeline
      const p = this.redis.pipeline()
      // execute pipeline
      p.exec()

    }

    @ fetch([ "string" ])
    from ({ m, from, limit, offset }) {

    }

    @ fetch([ "string" ])
    all ({ m, from, to, limit, offset }) {
    }

    @ fetch("number")
    check ({ m, from, to, time }) {

    }

    @ fetch("string")
    attr ({ m, from, to, time, attr }) {

    }

  }

  Object.defineProperty(Source, 'name', { value: Source.key })

}
