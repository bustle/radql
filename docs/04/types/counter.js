// types/counter.js

import { field
       , mutation
       , args
       , description
       , RadType
       } from '../../../src'

let value = 0
let mods = []

class Counter extends RadType {

  static description = "A simple counter"

  @ field("integer")
  @ description("The current value of the counter")
  value() {
    return value
  }

  @ field("number")
  @ args({ offset: "integer" })
  @ description("The time of last modification")
  mod({ offset = 0 } = {}) {
    return mods[mods.length - offset - 1]
  }

  @ mutation("integer")
  @ args({ amount: "integer!" })
  @ description("Increment a counter by a given amount")
  increment({ amount }) {
    mods.push(+Date.now())
    return value += amount
  }

}

export default Counter
