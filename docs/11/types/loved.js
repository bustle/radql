// types/loved.js

import Promise from 'bluebird'

import { field
       , mutation
       , args
       , description
       , service
       } from '../../../src'

import { Type, decorates } from '../../../src/radgraph'

import Loves from '../services/radgraph/loves'

const RadgraphType = Type(Loves, { fromKey: 'name' })

class Loved extends RadgraphType {

  @ service
  static create(root, name, id, { nickname, rank }) {
    return root.e$.Loves
      .add(name, id, { nickname, rank })
      .then(edge => new this(root, edge))
  }

  @ field("Person")
  person() {
    return this.from
  }

  @ field("Band")
  band() {
    return this.to
  }

  @ field("string")
  @ decorates('to', 'name')
  nickname() {
    return this.attr('nickname')
  }

  @ field("integer")
  @ decorates('to', 'rank')
  rank() {
    return this.attr('rank')
  }

}

export default Loved
