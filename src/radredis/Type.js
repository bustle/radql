import _        from 'lodash'
import Promise  from 'bluebird'
import Radredis from 'radredis'

import { field
       , mutation
       , service
       , description
       , args
       } from '../utils/decorators'

import { RadType } from '../utils/types'

const SYSTEM_PROPS =
  { id: { type: "integer", index: true }
  , created_at: { type: "integer", index: true }
  , updated_at: { type: "integer", index: true }
  }

const store = {}

export default function(source, schema, transforms = {}) {

  // RETRIEVE MEMOIZED CLASS DEFINITION

  if (store[schema.title])
    return store[schema.title]

  // CREATE NEW CLASS DEFINITION

  // instantiate radredis model
  const Model = Radredis(schema, transforms, source.opts)

  const title = schema.title
  // default 'type' property
  const type = schema.type || title

  // normalize props
  const properties = _.assign
    ( {}
    , SYSTEM_PROPS
    , schema.properties
    )


  // model keyspace
  const m = title.toLowerCase()

  // array of strict prop names
  const props = _(properties)
    .pickBy(p => !p.lazy)
    .keys()
    .value()

  class Type extends RadType {

    constructor(root, attrs) {
      super(root)
      this.attrs = attrs
    }

    static get(root, args) {
      return Type.find(root, args)
        .then(attrs => attrs && new this(root, attrs))
    }

    lazy(prop) {
      return this.attrs[prop]
        || ( this.attrs[prop] = this.e$[source.name]
               .prop({ m, prop, id: this.attrs.id })
               .then(v => deserializeAttr(v, prop))
           )
    }

    _update(attrs) {
      // diff against strict props
      // perform query
      Model.update(this.id, attrs)
    }

    _delete() {
      // bust cache
      // perform query
      return Model.delete(this.id)
    }

  }

  // utility functions
  Type.find = function(root, { id }) {
    return root.e$[source.name].get({ m, id, props })
      .then( attrs => _.reduce(attrs, (r, a) => r || a, false)
                   && deserialize(attrs)
           )
  }

  Type.all = function(root, attrs) {

  }

  Type.range = function(root, attrs) {

  }

  Type.create = function(root, attrs) {
    return Model.create(attrs)
  }

  return store[schema.title] = Type

  // deserializer
  function deserialize(attrs) {
    return _(props)
      .zipObject(attrs)
      .mapValues(deserializeAttr)
      .value()
  }

  function deserializeAttr(v, attr) {
    if (!v) return v
    const t = properties[attr].type
    if (t === 'array' || t === 'object')
      return JSON.parse(v)
    if (t === 'integer')
      return parseInt(v, 10)
    if (t === 'number' || t === 'float')
      return parseFloat(v, 10)
    return v
  }

}
