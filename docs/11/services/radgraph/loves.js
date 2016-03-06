// sources/radgraph/loves.js

import { Service } from '../../../../src/radgraph'
import source from './source'

const schema =
  { name: "Loves"
  , inverse: "LovedBy"
  , from: "Person"
  , to: "Band"
  , properties:
    { nickname: { type: "string" }
    , rank: { type: "integer" }
    }
  }

export default Service(source, schema)
