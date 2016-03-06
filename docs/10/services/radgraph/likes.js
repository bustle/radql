// sources/radgraph/likes.js

import { Service } from '../../../../src/radgraph'
import source from './source'

const schema =
  { name: "Likes"
  , inverse: "LikedBy"
  , from: "Person"
  , to: "Band"
  }

export default Service(source, schema)
