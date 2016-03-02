export class RadType {
  static new(root, args) {
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
}
