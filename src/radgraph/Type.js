import _        from 'lodash'
import Promise  from 'bluebird'


import { RadType } from '../utils/types'

import { field
       , mutation
       , description
       , args
       } from '../utils/decorators'

export default function(source, service) {

  class Type extends RadType {

  }

  return Type

}

