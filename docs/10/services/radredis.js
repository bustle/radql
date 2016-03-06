// services/radredis.js

import { Source } from '../../../src/radredis'

const opts =
  { name: 'Radredis'
  , db: 3
  }

export default Source(opts)
