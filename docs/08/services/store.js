// services/store.js

import path from 'path'
import fs from 'fs'

import { fetch
       , args
       , description
       , RadService
       } from '../../../src'

const store = path.join(__dirname, 'store.json')

function read() {
  return new Promise((resolve, reject) => {
    fs.readFile(store, (err, data) => {
      if (err)
        rejeect(err)
      else
        resolve(JSON.parse(data))
    })
  })
}

function write(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(store, JSON.stringify(data), (err) => {
      if (err)
        reject(err)
      else
        resolve(data)
    })
  })
}

class Store extends RadService {

  static description = "Data store"

  // Executes a list of read/write commands
  _fetch(jobs) {
    return read() // read store
      .then(data => {
        // apply all mutations
        for (let i = 0; i < jobs.length; i++) {
          const { type, key, value } = jobs[i].req
          // apply SET request
          if (type === 'set')
            data[key] = value
          // apply PUSH request
          if (type === 'push')
            data[key].push(value)
        }
        // write changes to disk
        return write(data)
      })
      .then(data => {
        // resolve our promises
        for (let i = 0; i < jobs.length; i++) {
          const job = jobs[i]
          job.resolve(data[job.req.key])
        }
      })
  }

  @ fetch("object")
  @ args({ key: "string!" })
  @ description("Retrieves an object from the store")
  get({ key }) {
    return { type: "get" , key }
  }

  @ fetch("object")
  @ args({ key: "string!", value: "object!" })
  @ description("Modifies a value in the store")
  set({ key, value }) {
    return { type: "set", key, value, busts: true }
  }

  @ fetch("object")
  @ args({ key: "string!", value: "object!" })
  @ description("Pushes object to array in store")
  push({ key, value }) {
    return { type: "push", key, value, busts: true }
  }

}

export default Store
