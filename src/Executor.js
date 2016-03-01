import Promise from 'bluebird'
import _       from 'lodash'

export default function(registry, { trace } = {}) {

  let rtCount = 0

  const cache = {}

  let queue = []

  let curJob = Promise.resolve()
  let nextJob = null

  const e$ =
    { fetch(r) {

      }
    , new(t, ...args) {
        registry.type(t)(...args)
      }
    }

  return e$

}
