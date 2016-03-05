import { Service } from '../../../../src/radgraph'
import source from './source'

const schema =
  { from: "Person"
  , fromKey: "name"
  , to: "Band"
  }

export default Service(source, schema)
