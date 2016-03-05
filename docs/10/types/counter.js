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
    return this.e$.Store.get({ key: 'value' })
  }

  @ field("number")
  @ args({ offset: "integer" })
  @ description("The time of last modification")
  mod({ offset = 0 } = {}) {
    return this.e$.Store.get({ key: 'mods' })
      .then(mods => mods[mods.length - offset - 1])
  }

  @ mutation("integer")
  @ args({ amount: "integer!" })
  @ description("Increment a counter by a given amount")
  increment({ amount }) {
    const Store = this.e$.Store
    return Store.push({ key: 'mods', value: +Date.now() })
      .then(() => Store.get({ key: 'value' }))
      .then(value => Store.set({ key: 'value', value: value + amount }))
  }

}

export default Counter
