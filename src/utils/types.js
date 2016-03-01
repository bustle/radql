export class RadAPI {
  constructor({ e$ }) {
    this.e$ = e$
  }
}

export class RadType {
  constructor({ e$ }, attrs) {
    this.e$ = e$
    this.attrs = attrs
  }
}

export class RadService {
  constructor({ e$ }) {
    this.e$ = e$
  }
}
