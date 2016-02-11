import optimistPromiseMiddleware from '../src/'
import { spy } from 'sinon'
import { resolve, reject } from '../src/'

function noop () {}
const GIVE_ME_META = 'GIVE_ME_META'
function metaMiddleware () {
  return (next) => (action) =>
    action.type === GIVE_ME_META
      ? next({ ...action, meta: 'here you go' })
      : next(action)
}

describe('optimsit promise handling middleware', () => {
  let next
  let dispatch
  let foobar
  let err

  beforeEach(() => {
    next = spy()
    dispatch = function d (action) {
      const store = { dispatch: d, getState: noop }
      return metaMiddleware()(optimistPromiseMiddleware()(store)(next))(action)
    }
    foobar = { foo: 'bar' }
    err = new Error()
  })
  it('dispatches first action before promise with BEGIN optimist tag without meta', () => {
    dispatch({
      type: 'ACTION_TYPE',
      meta: {
        promise: new Promise(() => {}),
        optimist: true
      }
    })

    expect(next.calledOnce).to.be.true

    expect(next.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      optimist: {type: 'BEGIN', id: 0}
    })
  })

  it('dispatches first action before promise with BEGIN optimist tag with meta', () => {
    dispatch({
      type: 'ACTION_TYPE',
      payload: {
        bar: 'foo'
      },
      meta: {
        promise: new Promise(() => {}),
        optimist: true,
        foo: 'bar'
      }
    })

    expect(next.calledOnce).to.be.true

    expect(next.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: {
        bar: 'foo'
      },
      meta: {
        foo: 'bar'
      },
      optimist: {type: 'BEGIN', id: 0}
    })
  })

  it('does NOT dispatch first action before promise if skipOptimist meta', async () => {
    await dispatch({
      type: 'ACTION_TYPE',
      meta: {
        promise: Promise.resolve(foobar),
        skipOptimist: true
      }
    })

    expect(next.calledOnce).to.be.true

    expect(next.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE_RESOLVED',
      payload: foobar,
      meta: {
        skipOptimist: true
      }
    })
  })

  it('dispatches resolve action with COMMIT optimist', async () => {
    await dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      payload: {
        foo2: 'bar2'
      },
      meta: {
        promise: Promise.resolve(foobar),
        optimist: true
      }
    })

    expect(next.calledTwice).to.be.true

    expect(next.secondCall.args[0]).to.deep.equal({
      type: resolve('ACTION_TYPE_RESOLVE'),
      payload: foobar,
      meta: {
        payload: {
          foo2: 'bar2'
        }
      },
      optimist: {type: 'COMMIT', id: 0}
    })
  })

  it('dispatches reject action with REVERT optimist', async () => {
    try {
      await dispatch({
        type: 'ACTION_TYPE_REJECT',
        payload: {
          foo3: 'bar3',
          foo4: 'bar4'
        },
        meta: {
          promise: Promise.reject(err),
          optimist: true
        }
      })
    } catch (e) {
      // We're not interested in the rejection. We just need to wait until all
      // dispatching is done.
      true
    }

    expect(next.calledTwice).to.be.true

    expect(next.secondCall.args[0]).to.deep.equal({
      type: reject('ACTION_TYPE_REJECT'),
      payload: err,
      meta: {
        payload: {
          foo3: 'bar3',
          foo4: 'bar4'
        }
      },
      optimist: {type: 'REVERT', id: 0}
    })
  })
})
