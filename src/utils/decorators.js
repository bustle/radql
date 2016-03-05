export function field(t, a) {
  return function (target, name, descriptor) {
    const { value } = descriptor
    value.field = true
    value.type = value.type || t
    value.args = value.args || a
    descriptor.enumerable = true
    descriptor.writable = false
    return descriptor
  }
}

export function mutation(t, a) {
  return function (target, name, descriptor) {
    const { value } = descriptor
    value.mutation = true
    value.type = value.type || t
    value.args = value.args || a
    descriptor.enumerable = true
    descriptor.writable = false
    return descriptor
  }
}

export function fetch(t, a) {
  return function (target, name, descriptor) {
    // define method type
    descriptor.value.field = true
    descriptor.value.fetch = true
    descriptor.enumerable = true
    descriptor.writable = false
    // decorate underlying method
    const req = descriptor.value
    descriptor.value = function(...args) {
      const r = req(...args)
      if (!r.src) r.src = this
      return this.e$.fetch(r)
    }
    // retrieve old values
    descriptor.value.type = req.type || t
    descriptor.value.args = req.args || a
    descriptor.value.description = req.description
    return descriptor
  }
}

export function type(t) {
  return function(target, name, descriptor) {
    descriptor.value.type = t
    return descriptor
  }
}

export function args(a) {
  return function(target, name, descriptor) {
    descriptor.value.args = a
    return descriptor
  }
}

export function description(d) {
  return function(target, name, descriptor) {
    descriptor.value.description = d
    return descriptor
  }
}
