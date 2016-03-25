import { serve } from './ks'
import { check } from './utils'

const q = `{
  API(foo: "foobiedoobiedoo") {
    foo
    bar(arr: [ 1, 2, 3, 4, 5 ])
    req
  }
}`

describe ('kitchen sink', function() {

  it ('should work', function() {
    return check(serve, q, { API: { foo: 'foobiedoobiedoo', bar: 5, req: "foo" } })
  })

  it ('should implement types', function() {
    return check
      ( serve
      , `{
          AnimalAPI {
            dog {
              name
              species
              bark
            }
            cat {
              name(nick: true)
              species
              purr
            }
            snek {
              hiss
            }
          }
        }`
      , { AnimalAPI:
          { dog:
            { name: "Sparky"
            , species: "Dog"
            , bark: "woof"
            }
          , cat:
            { name: "Little Ms. Cuddles"
            , species: "Cat"
            , purr: "meow"
            }
          , snek:
            { hiss: "i am a snek"
            }
          }
        }
      )
  })

  it ('should implement unions', function() {
    return check
      ( serve
      , `{
          AnimalAPI {
            animals {
              ... on Dog {
                name(nick: true)
                species
                bark
              }
              ... on Cat {
                name
                species
                purr
              }
              ... on Snek {
                hiss
              }
            }
          }
        }`
      , { AnimalAPI:
          { animals:
            [ { hiss: "i am a snek"
              }
            , { name: "Mr. Sparky II."
              , species: "Dog"
              , bark: "woof"
              }
            , { name: "Cuddles the Magnificent"
              , species: "Cat"
              , purr: "meow"
              }
            ]
          }
        }
      )

  })

  it ('should implement interfaces', function() {
    return check
      ( serve
      , `{
          AnimalAPI {
            pets {
              name
              species
              ... on Dog {
                bark
              }
              ... on Cat {
                purr
              }
            }
          }
        }`
      , { AnimalAPI:
          { pets:
            [ { name: "Sparky the Third, May His Name Reach a Thousand Stars"
              , species: "Dog"
              , bark: "woof"
              }
            , { name: "Madame Cuddles the Everlasting"
              , species: "Cat"
              , purr: "meow"
              }
            ]
          }
        }
      )

  })

  it ('should delegate fields', function() {
    return check
      ( serve
      , `{
          AnimalAPI {
            dogName(name: "Sparky", nick: true)
          }
        }`
      , { AnimalAPI:
          { dogName: "Mr. Sparky"
          }
        }
      )
  })

  it ('should delegate services', function() {
    return check
      ( serve
      , `{
          AnimalAPI {
            hiss1: hiss
            hiss5: hiss(amount: 5)
          }
        }`
      , { AnimalAPI:
          { hiss1: "hiss..."
          , hiss5: "hiss... hiss... hiss... hiss... hiss..."
          }
        }
      )
  })

  it ('should delegate mutations', function() {
    return check
      ( serve
      , `mutation {
          AnimalAPI__hissMore
        }`
      , { AnimalAPI__hissMore: 'hiss hiss hiss'
        }
      )
  })

  it ('should authenticate delegates', function() {
    return check
      ( serve
      , `mutation {
          AuthAPI__hissMore(foo: "test")
        }`
      , { AuthAPI__hissMore: null
        }
      )
  })

})
