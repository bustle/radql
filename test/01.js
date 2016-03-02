import { serve } from '../docs/01'
import { check } from './utils'

describe ('01 - Getting Started', function() {

  it ('should perform a "hello world" query', function() {

    const q = `
    {
      HelloWorld {
        hello
      }
    }`

    const r =
    {
      "HelloWorld": {
        "hello": "world"
      }
    }

    return check(serve, q, r)

  })

})
