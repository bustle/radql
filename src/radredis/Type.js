import _        from 'lodash'
import Promise  from 'bluebird'
import Radredis from 'radredis'

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
  const props = _.keys(properties)

  // model keyspace
  const m = title.toLowerCase()

  class Type extends RadType {

    constructor(root, attrs) {
      super(root)
      this._id = attrs.id
      this._attrs = _.mapValues(attrs, Promise.resolve)
      this._src = this.e$[source._name]
    }

    static args = { id: 'id!' }

    static key({ id }) { return id }

    static get(root, { id }) {
      return root.e$[source._name]
        .attr(m, id, 'id')
        .then(id => id && new this(root, { id }))
    }

    static all(root, { index = 'id', limit = 30, offset = 0 } = {}) {
      return Model.all({ index, limit, offset, properties: [ 'id' ] })
    }

    static range(root, { index, min, max, limit = 30, offset = 0 } = {}) {
      return Model.range({ index, limit, offset, min, max, properties: [ 'id' ] })
    }

    static create(root, attrs) {
      return Model.create(attrs)
    }

    attr(attr) {
      return this._attrs[attr]
        || ( this._attrs[attr] = this._src
               .attr(m, this._id, attr)
               .then(v => deserializeAttr(v, attr))
           )
    }

    setAttr(attr, val) {
      return this._attrs[attr] = this.e$.setKey
        ( source._name
        , `${m}:${this._id}:${attr}`
        , Promise.resolve(val)
        )
    }

    _update(attrs) {
      // remove undefined values
      attrs = _(attrs).omitBy(p => _.isUndefined(p)).omit('id').value()
      // update caches
      _.forEach ( attrs , (val, attr) => this.setAttr(attr, val) )
      // perform query
      return Model.update(this._id, attrs)
        // return self
        .return(this)
    }

    // resolve all fields (for doing better updates)
    _all() {
      return Promise.all( _.map(props, name => this.attr(name) ) )
        .then(attrs => _.zipObject(props, attrs))
    }

    _delete() {
      // bust cache
      _.forEach
        ( this._attrs
        , (attr, name) => {
            this.e$.bustKey(source._name, `${m}:${this._id}:${name}`)
          }
        )
      // perform query
      return Model.delete(this._id)
        // create internal representation
        .then(vals => this._attrs = _.mapValues(vals, Promise.resolve))
        // return self
        .return(this)
    }

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
