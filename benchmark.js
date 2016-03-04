import _       from 'lodash'
import Faker   from 'faker'
import Promise from 'bluebird'
import Redis   from 'ioredis'

const r = new Redis({ db: 7 })

const attrs =
  [ 'foo'
  , 'bar'
  , 'baz'
  , 'wux'
  , 'a'
  , 'b'
  , 'c'
  , 'd'
  , 'e'
  , 'f'
  ]

function generate() {
  const p = r.pipeline()
  _.forEach
    ( _.range(1, 1001)
    , i => {
        const fixture =
          { foo: Faker.lorem.sentence()
          , bar: Faker.lorem.paragraph()
          , baz: Faker.lorem.sentence()
          , baz: Faker.lorem.paragraph() + Faker.lorem.paragraph()
          , wux: Faker.lorem.words(1)
          , a: Faker.lorem.words(2)
          , b: Faker.lorem.words(3)
          , c: _.random(1, 5)
          , d: Faker.lorem.sentence()
          , e: Faker.lorem.words(4)
          , f: Faker.lorem.words(5)
          }
        p.hmset
          ( i
          , fixture
          )
        _.forEach
          ( fixture
          , (v, k) =>
              p.set(`${i}:${k}`, v)
          )
      }
    )
  return p.exec()
}

function times200(fn) {
  _.forEach
    ( _.range(1, 200)
    , i => fn(i*5 - _.random(0, 4))
    )
}

function hgetall() {
  const p = r.pipeline()
  times200(id => {
    p.hgetall(id)
  })
  console.time("hgetall")
  return p.exec()
    .then(() => console.timeEnd("hgetall"))
}

function hmget() {
  const p = r.pipeline()
  times200(id => {
    p.hgetall(id, attrs)
  })
  console.time("hmget")
  return p.exec()
    .then(() => console.timeEnd("hmget"))
}

function hget() {
  const p = r.pipeline()
  times200(id => {
    _.forEach
      ( attrs
      , attr =>
          p.hget(id, attr)
      )
  })
  console.time("hget")
  return p.exec()
    .then(() => console.timeEnd("hget"))
}

function get() {
  const p = r.pipeline()
  times200(id => {
    _.forEach
      ( attrs
      , attr =>
          p.get(`${id}:${attr}`)
      )
  })
  console.time("get")
  return p.exec()
    .then(() => console.timeEnd("get"))
}

function serial(promises) {
  return _.reduce
    ( promises
    , (p, n) => p.then(n)
    , Promise.resolve()
    )
}

function job(n) {
  console.log("JOB", n)
  return r.flushdb()
    .then(generate)
    .then(hgetall)
    .then(hmget)
    .then(hget)
    .then(get)
}

serial(_.map(_.range(1, 100), i => () => job(i)))
