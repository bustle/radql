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
    from({ from, limit, offset }) {

    }

    @ field("object")
    of({ from }) {

    }

    @ field([ "object" ])
    find({ from, to, time }) {

    }

    @ field("object")
    get({ from, to, limit, offset }) {

    }

    @ field("object")
    attr({ from, to, time, attr }) {

    }

    // mutations

    @ mutation("object")
    add({  }) {

    }

    @ mutation("object")
    set({  }) {

    }

    @ mutation("delete")
    delete({  }) {

    }

    @ mutation("deleteAll")
    deleteAll({  }) {

    }

  }

}
