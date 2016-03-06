import _        from 'lodash'
import Promise  from 'bluebird'
import Radgraph from 'radgraph'

import { ParseAdj
       , ParseFullAdj
       , head
       } from 'radgraph/lib/utils'

import { RadService } from '../utils/types'
export default function(source, schema, transforms) {

  const Edge = Radgraph(schema, transforms, source.opts)

  const fns = fromEdge(Edge)
  const deserializers = {}

  class Service extends RadService {

    constructor(root) {
      super(root)
      this.src = this.e$[source.name]
      if (Edge.inv) {
        this.inv = fromEdge(Edge.inv, true)
        this.inv.src = this.src
      }
    }

    // fields
    from      = fns.from
    of        = fns.of
    find      = fns.find
    get       = fns.get
    attr      = fns.attr

    // mutations
    add       = fns.add
    set       = fns.set
    delete    = fns.delete
    deleteAll = fns.deleteAll

  }

  Object.defineProperty(Service, 'name', { value: schema.name })

  return Service

  function fromEdge(Edge, isInv) {

    const { _keyspace     : m
          , _edgeKeyspace : e
          , _type         : type
          } = Edge

    const fns =
      { from(from, params) {
          return this.src.from(m, from, params)
            .map(ParseAdj(type, from))
        }

      , of(from) {
          return this.from(from, { limit: 1 })
            .then(head)
        }

      , find(key1, key2, params) {
          const [from, to] = isInv ? [key2, key1]
                                   : [key1, key2]
          return this.src.find(e, from, to, params)
            .map(ParseFullAdj(type, from, to))
        }

      , get(key1, key2, time) {
          const [from, to] = isInv ? [key2, key1]
                                   : [key1, key2]
          return time
            ? this.src.check(e, from, to, time)
                .then(ParseFullAdj(type, from, to))
            : this.find(from, to, { limit: 1 })
                .then(head)
        }

      , attr(key1, key2, time, attr) {
          const [from, to] = isInv ? [key2, key1]
                                   : [key1, key2]
          return this.src.attr(e, from, to, time, attr)
            .then(deserialize(attr))
        }

        // mutations
      , add:       (from, to, attrs) => Edge.add(from, to, attrs)
      , set:       (from, to, attrs) => Edge.set(from, to, attrs)
      , delete:    (from, to, time ) => Edge.delete(from, to, time)
      , deleteAll: (from           ) => Edge.deleteAll(from)
      }

    return fns
  }


  function deserialize(attr) {
    return deserializers[attr]
      || ( deserializers[attr] = function(v) {
              if (!v) return v
              const t = schema.properties[attr].type
              if (t === 'array' || t === 'object')
                return JSON.parse(v)
              if (t === 'integer')
                return parseInt(v, 10)
              if (t === 'number' || t === 'float')
                return parseFloat(v, 10)
              return v
            } )
  }


}
