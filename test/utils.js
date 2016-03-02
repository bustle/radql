import _            from 'lodash'
import { assert }   from 'chai'

export function checkData(act, exp) {
  if (exp === __time__) {
    assert.isNumber(act)
  } else if (_.isArray(exp)) {
    assert.isArray(act)
    _.forEach
      ( exp
      , (v, k) => checkData(act[k], v)
      )
  } else if (_.isObject(exp)) {
    assert.isObject(act)
    _.forEach
      ( exp
      , (v, k) => checkData(act[k], v)
      )
  } else {
    assert.equal(act, exp)
  }
}

export function check(serve, query, data, fuck) {
  return serve(query)
    .then(r => {
      if (fuck)
        console.log(r)
      if (data === __error__)
        return assert.isDefined(r.errors)
      assert.isUndefined(r.errors)
      checkData(r.data, data)
    })
}

export const __time__ = { token: 'time' }
export const __error__ = { token: 'error' }
