// types/counter.js

import { field
       , mutation
       , args
       , description
       , RadType
       } from '../../../src'

class Counter extends RadType {

  static description = "A simple counter"

  @ field("integer")
  @ description("The current value of the counter")
  value() {
    return this.e$.Store.get('value')
  }

  @ field("number")
  @ args({ offset: "integer" })
  @ description("The time of last modification")
  mod({ offset = 0 } = {}) {
    return this.e$.Store.get('mods')
      .then(mods => mods[mods.length - offset - 1])
  }

  @ mutation("integer")
  @ args({ amount: "integer!" })
  @ description("Increment a counter by a given amount")
  increment({ amount }) {
    const Store = this.e$.Store
    return Store.push('mods', +Date.now())
      .then(() => Store.get('value'))
      .then(value => Store.set('value', value + amount))
  }

}

export default Counter
