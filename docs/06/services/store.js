// services/store.js

import { field
       , mutation
       , args
       , description
       , RadService
       } from '../../../src'

const store =
  {
  }

class Store extends RadService {

  @ field("object")
  @ args({ key: "string!" })
  @ description("Retrieves a object from the store")
  find({ key }) {

  }

  @ mutation("object")
  @ args({ key: "string!", payload: "object" })
  @ description("Adds an object to the store")
  create({ key, payload }) {

  }

  @ mutation("object")
  @ args({ key: "string!" })
  @ description("Deletes an object from the store")
  delete({ key }) {

  }

}

export default PersonService
