import { serve } from '../docs/02'
import { check
       , __time__
       } from './utils'

describe ('02 - APIs', function() {

  it ('should perform a basic query', function() {

    const q = `{ Counter { value mod } }`
    const r = { "Counter": { "value": 0, "mod": null } }

    return check(serve, q, r)

  })

  it ('should perform mutations', function() {

    const q = `mutation { Counter__increment(amount: 5) { value mod } }`
    const r = { "Counter__increment": { "value": 5, "mod": __time__ } }

    return check(serve, q, r)

  })

  it ('should query with labels', function() {

    const q = `{ Counter { value mod latest: mod(offset: 0) second: mod(offset: 1) } }`
    const r = { "Counter": { "value": 5, "mod": __time__, "latest": __time__, "second": null } }

    return check(serve, q, r)

  })


})
