import _       from 'lodash'
import Promise from 'bluebird'
import Redis   from 'ioredis'

import { RadService } from '../utils/types'

import { field
       , mutation
       , description
       , args
       } from '../utils/decorators'

export default function(source, schema) {

  class Service extends RadService {

    constructor(root) {
      super(root)
      this.src = this.e$[source.name]
    }

    // fields

    @ field([ "object" ])
    from({}) {

    }

    @ field("object")
    of({}) {

    }

    @ field("object")
    get({  }) {

    }

    @ field([ "object" ])
    find({  }) {

    }

    // mutations

    @ mutation("object")
    add({  }) {

    }


  }

}
