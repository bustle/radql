export function field(t, a) {
  return function (target, name, descriptor) {
    const { value } = descriptor
    value.field = true
    value.type = value.type || t
    value.args = value.args || a
    descriptor.enumerable = true
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
    descriptor.value.descriptor = d
    return descriptor
  }
}
