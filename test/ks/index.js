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
  }

  @ field
  @ type("string")
  foo() {
    return this._foo
  }

  @ field
  @ type("integer")
  @ args({ arr: [ "number!" ] })
  bar({ arr }) {
    return arr.length
  }

}

const APIs = [ API ]
const Types = [  ]
const Services = [  ]

const { serve } = RadQL(APIs, Types, Services)

export { serve }
