import _        from 'lodash'
import Promise  from 'bluebird'
import Radgraph from 'radgraph'

import { RadService } from '../utils/types'

export default function(source, schema, transforms) {

  const Edge = Radgraph(schema, transforms, source.opts)

  class Service extends RadService {

    constructor(root) {
      super(root)
      this.src = this.e$[source.name]
    }

    // fields

    from({ from, limit, offset }) {

    }

    of({ from }) {

    }

    find({ from, to, time }) {

    }

    get({ from, to, limit, offset }) {

    }

    attr({ from, to, time, attr }) {

    }

    // mutations

    add({  }) {

    }

    set({  }) {

    }

    delete({  }) {

    }

    deleteAll({  }) {

    }

  }

  return Service

}
