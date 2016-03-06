import _        from 'lodash'
import Promise  from 'bluebird'


import { RadType } from '../utils/types'

import { field
       , mutation
       , description
       , args
       } from '../utils/decorators'

export default function(service, { fromKey = 'id', toKey = 'id' }) {

  const { schema, source, _keySp } = service
  const props = _.keys(schema.properties)

  class Type extends RadType {

    static args =
      { type: "string!"
      , from: "id!"
      , to: "id!"
      , time: "number!"
      , data: "object"
      }

    constructor(root, { type, from: key1, to: key2, time, data }) {
      super(root)
      const [ from, to ] = (type === schema.name)
                         ? [ key1, key2 ]
                         : [ key2, key1 ]
      this._fromKey = from
      this._toKey   = to
      this._time    = time
      this._attrs   = _.mapValues(data, Promise.resolve)
      this._service = this.e$[service.name]
    }

    static key({ type, from, to, time }) {
      return type === schema.name
        ? `${schema.name}:${from}:${to}:${time}`
        : `${schema.name}:${to}:${from}:${time}`
    }

   get to() {
      return this._to
        || ( this._to =
                this.e$[schema.to]
                ({ [toKey]: this._toKey })
           )
    }

    get from() {
      return this._from
        || ( this._from =
                this.e$[schema.from]
                ({ [fromKey]: this._fromKey })
           )
    }

    attr(attr) {
      return this._attrs[attr]
        || ( this._attrs[attr] = this._service
               .attr(this._fromKey, this._toKey, this._time, attr)
           )
    }

    setAttr(attr, val) {
      return this._attrs[attr] = this.e$.setKey
        ( source.name
        , `${_keySp}:${this._fromKey}:${this._toKey}:${this._time}:${attr}`
        , Promise.resolve(val)
        )
    }

    // resolve all fields (for doing partial updates)
    _all() {
      return Promise.all( _.map(props, name => this.attr(name)) )
        .then(attrs => _.zipObject(props, attrs))
    }

    _update(attrs) {
      attrs = _(attrs).omitBy(p => _.isUndefined(p)).omit('id').value()
      _.forEach (attrs, (val, attr) => this.setAttr(attr, val) )
      return this._service.set(this._fromKey, this._toKey, this._time, attrs)
    }

    _delete() {
      _.forEach
        ( this._attrs
        , (attr, name) => {
            this.e$.bustKey(source.name, `${_keySp}:${this._fromKey}:${this._toKey}:${this._time}:${attr}`)
          }
        )
      return this._service.delete(this._fromKey, this._toKey, this._time)
        .return(this)
    }

  }

  return Type

}

export function decorates (end, val) {
  return function (target, name, descriptor) {
    const res = descriptor.value
    descriptor.value = function(...args) {
      return res.bind(this)(...args)
        .then(v => v || this[end].then(m => m[val](...args)))
    }
    return descriptor
  }
}
