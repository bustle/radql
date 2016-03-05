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

      // build pipeline
      const p = this.redis.pipeline()
      // execute pipeline
      p.exec()

    }

    @ fetch
    from (m, from, { limit, offset }) {

    }

    @ fetch
    all (m, from, to, { limit, offset }) {
    }

    @ fetch
    check (m, from, to, time) {

    }

    @ fetch
    attr (m, from, to, time, attr) {

    }

  }

  Object.defineProperty(Source, 'name', { value: opts.name || 'Radgraph' })

  return Source

}
