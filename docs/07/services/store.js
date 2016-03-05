// services/store.js

import path from 'path'
import fs from 'fs'

import { RadService } from '../../../src'

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

  get(key) {
    return read()
      .then(data => data[key])
  }

  set(key, value) {
    return read()
      .then(data => {
        data[key] = value
        return write(data)
      })
      .then(() => value)
  }

  push(key, value) {
    return read()
      .then(data => {
        data[key].push(value)
        return write(data)
          .then(() => data[key])
      })
  }

}

export default Store
