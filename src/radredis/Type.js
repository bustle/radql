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

  // lazy loaded attributes
  const lazy = {}
  _(properties)
    .pickBy(p => p.lazy)
    .forEach
      ( (attr, name) => Object.defineProperty
          ( lazy
          , name
          , { get() {
                return this.e$[source.name]
                  .prop({ m, id: this.attrs.id, prop: name })
                  .then(v => deserializeAttr(v, name))
              }
            }
          )
      )

  class RadredisType extends RadType {

    constructor(root, attrs) {
      super(root)
      this.attrs = attrs
    }

    lazy = lazy

    @ service(type)
    @ args({ id: "id!" })
    @ description(`Retrieves a "${type}" by its id (radredis)`)
    static get(root, { id }) {
      // evalulate strict props
    }

    @ description(`Retrieves all "${type}"s by an index (radredis)`)
    static all(root, { id }) {
    }

    @ description(`Retrieves all "${type}"s by an index (radredis)`)
    static all(root, { id }) {
    }

    @ description(`Creates a new "${type}" from given attributes`)
    static create(root, { id }) {
      return Model.create(this.id, {})
        .then(new this(root, id, { something }))
    }

    @ field("id!")
    @ description(`Primary key of current "${type}"`)
    id() {
      return this.attrs.id
    }

    @ description(`Update a "${type}" with the given attributes`)
    _update(attrs) {
      // diff against strict props
      // perform query
      Model.update(this.id, attrs)
    }

    @ description(`Delete a "${type}"`)
    _delete() {
      // bust cache
      // perform query
      return Model.delete(this.id)
    }

  }

  // lazy load a property
  function lazyLoad(prop, name) {
    return this.e$[source.name].prop({ m, prop, id: this.id })
      .then(v => deserializeProp(prop, v))
  }

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
