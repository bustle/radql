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
      this._id = attrs.id
      this._attrs = attrs
    }

    static get(root, args) {
      return Type.find(root, args)
        .then(id => id && new this(root, { id }))
    }

    attr(prop) {
      return this._attrs[prop]
        || ( this._attrs[prop] = this.e$[source.name]
               .prop({ m, prop, id: this._id })
               .then(v => deserializeAttr(v, prop))
           )
    }

    _update(attrs) {
      // diff against strict props
      // perform query
      return Model.update(this._id, attrs)
        .return(this)
    }

    _delete() {
      // bust cache
      // perform query
      return Model.delete(this._id)
        .return(this)
    }

  }

  // utility functions
  Type.find = function(root, { id }) {
    return root.e$[source.name]
      .prop({ m, id, prop: 'id' })
  }

  Type.all = function(root, { index = 'id', limit = 30, offset = 0 } = {}) {
    return Model.all({ index, limit, offset, properties: [ 'id' ] })
  }

  Type.range = function(root, { index, min, max, limit = 30, offset = 0 } = {}) {
    return Model.range({ index, limit, offset, min, max, properties: [ 'id' ] })
  }

  Type.create = function(root, attrs) {
    return Model.create(attrs)
  }

  return store[schema.title] = Type

  // deserializer
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
