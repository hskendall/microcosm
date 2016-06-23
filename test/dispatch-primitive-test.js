import Microcosm from '../src/microcosm'
import assert from 'assert'

describe('When dispatching primitive values', function() {
  let app = null
  let add = num => num

  let Store = {
    getInitialState: () => 1,
    register() {
      return {
        [add]: (a, b) => a + b
      }
    }
  }

  it ('properly reduces from a store', function() {
    app = new Microcosm()

    app.addStore('test', Store)

    app.push(add, 2).onDone(function() {
      assert.equal(app.state.test, 3)
    })
  })
})
