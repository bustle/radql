export class RadType {
  static get(root, args) {
    return new this(root, args)
  }
  constructor({ e$ }) {
    this.e$ = e$
  }
}

// aliases RadAPI to RadType
export { RadType as RadAPI }

export class RadService {
  constructor({ e$ }) {
    this.e$ = e$
  }
  // TODO: fix this bullshit when lambda upgrades its shit
  static get __name() {
    return this._name || this.name
  }
}

// @ field ( RadUnion[ "Post", "Type" ] )
export function RadUnion(name, types) {
  return { RadUnion: name, types }
}

export function RadInterface(name, fields) {
  return { RadInterface: name, fields }
}
