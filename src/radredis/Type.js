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
    }

    static get(root, { id }) {
      return root.e$[source.name]
        .prop({ m, id, prop: 'id' })
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
      // remove falsey values
      attrs = _(attrs).omitBy(p => _.isUndefined(p)).omit('id').value()
      // update caches
      _.forEach
        ( attrs
        , (attr, name) => {
            // update internal representation
            this._attrs[name] = this.e$.setKey
              ( source.key
              , `${m}:${this._id}:${name}`
              , Promise.resolve(attr)
              )
          }
        )
      // perform query
      return Model.update(this._id, attrs)
        // return self
        .return(this)
    }

    // resolve all fields (for doing better updates)
    _all() {
      return Promise.all( _.map(keys, name => this.attr(name) ) )
        .then(attrs => _.zipObject(props, attrs))
        .then(all => _.mapValues(all, deserializeAttr))
    }

    _delete() {
      // bust cache
      _.forEach
        ( this._attrs
        , (attr, name) => {
            this.e$.bustKey(source.key, `${m}:${this._id}:${name}`)
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
