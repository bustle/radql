// services/radredis.js

import { Source } from '../../../src/radredis'

const opts =
  { name: 'Radredis'
  , db: 4
  }

export default Source(opts)
