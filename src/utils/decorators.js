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

export function service (target, name, descriptor) {
  descriptor.value.service = true
  descriptor.enumerable = true
  descriptor.writable = false
  return descriptor
}

export function fetch (target, name, descriptor) {
  // define method type
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
  descriptor.value.type = req.type
  descriptor.value.args = req.args
  descriptor.value.description = req.description
  return descriptor
}

export function delegate(f) {
  return function(target, name, descriptor) {
    const fn = descriptor.value
    descriptor.value = { delegates: fn() }
    if (f === "field")
      descriptor.value.field = true
    if (f === "mutation")
      descriptor.value.mutation = true
    descriptor.enumerable = true
    return descriptor
  }
}

export function decorates(fn) {
  return function (target, name, descriptor) {
    const res = descriptor.value
    descriptor.value = function(...args) {
      return res.bind(this)(...args)
        .then(v => v || fn.bind(this)(...args))
    }
    return descriptor
  }
}
