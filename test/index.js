import { serve } from './ks'
import { check } from './utils'

const q = `{
  API(foo: "foobiedoobiedoo") {
    foo
    bar(arr: [ 1, 2, 3, 4, 5 ])
  }
}`

describe ('kitchen sink', function() {
  it ('should work', function() {
    return check(serve, q, { API: { foo: 'foobiedoobiedoo', bar: 5 } })
  })
})
