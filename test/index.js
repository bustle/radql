import { serve } from './ks/'

const q = `{
  API(foo: "foobiedoobiedoo") {
    foo
    bar(arr: [ 1, 2, 3, 4, 5 ])
  }
}`

serve(q).then(console.log)
