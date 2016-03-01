export function field(target, name, descriptor) {
  descriptor.value.field = true
  descriptor.enumerable = true
  return descriptor
}

export function mutation(target, name, descriptor) {
  descriptor.value.mutation = true
  descriptor.enumerable = true
  return descriptor
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
