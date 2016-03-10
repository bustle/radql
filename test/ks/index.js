import RadQL from '../../src'

import { field
       , mutation
       , type
       , args
       , description

       , RadAPI
       , RadType
       , RadService

       } from '../../src'

class API extends RadAPI {

  static description = "My Fun API"
  static args = { foo: "string"
                }

  constructor(root, { foo }) {
    super(root)
    this._foo = foo
    this._req = root.req.foo
  }

  @ field("string")
  foo() {
    return this._foo
  }

  @ field("string")
  req() {
    return this._req
  }

  @ field
    ( "integer"
    , { arr: [ "number!" ] }
    )
  bar({ arr }) {
    return arr.length
  }

}

const APIs = [ API ]
const Types = [  ]
const Services = [  ]

const rql = RadQL(APIs, Types, Services)

function serve(query) {
  return rql.serve(query, null, { foo: "foo" })
}

export { serve }
