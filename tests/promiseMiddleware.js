import optimistPromiseMiddleware from '../src/'
import { spy } from 'sinon'
import { resolve, reject } from '../src/'

function noop () {}
const GIVE_ME_META = 'GIVE_ME_META'
function metaMiddleware () {
  return next => action =>
    action.type === GIVE_ME_META
      ? next({ ...action, meta: 'here you go' })
      : next(action)
}

describe('promise handling middleware', () => {
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
  it('dispatches first action before promise without arguments', () => {
    dispatch({
      type: 'ACTION_TYPE',
      meta: {
        promise: new Promise(() => {})
      }
    })

    expect(next.calledOnce).to.be.true

    expect(next.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE'
    })
  })

  it('dispatches first action before promise with arguments', () => {
    dispatch({
      type: 'ACTION_TYPE',
      payload: {
        foo: 'bar'
      },
      meta: {
        promise: new Promise(() => {})
      }
    })

    expect(next.calledOnce).to.be.true

    expect(next.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: {
        foo: 'bar'
      }
    })
  })

  it('dispatches resolve action with arguments', async () => {
    await dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      payload: {
        foo2: 'bar2'
      },
      meta: {
        promise: Promise.resolve(foobar)
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
      }
    })
  })

  it('dispatches reject action with arguments', async () => {
    try {
      await dispatch({
        type: 'ACTION_TYPE_REJECT',
        payload: {
          foo3: 'bar3',
          foo4: 'bar4'
        },
        meta: {
          promise: Promise.reject(err)
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
      }
    })
  })

  it('does not overwrite any meta arguments', async () => {
    await dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      payload: {
        foo2: 'bar2'
      },
      meta: {
        promise: Promise.resolve(foobar),
        foo3: 'bar3'
      }
    })

    expect(next.calledTwice).to.be.true

    expect(next.secondCall.args[0]).to.deep.equal({
      type: resolve('ACTION_TYPE_RESOLVE'),
      payload: foobar,
      meta: {
        foo3: 'bar3',
        payload: {
          foo2: 'bar2'
        }
      }
    })
  })

  it('does not include empty meta payload attribute', async () => {
    await dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      meta: {
        promise: Promise.resolve(foobar)
      }
    })

    expect(next.calledTwice).to.be.true

    expect(next.secondCall.args[0]).to.deep.equal({
      type: resolve('ACTION_TYPE_RESOLVE'),
      payload: foobar
    })
  })

  it('returns the original promise from dispatch', () => {
    let promiseDispatched = new Promise(() => {})

    let dispatchedResult = dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      meta: {
        promise: promiseDispatched,
        foo2: 'bar2'
      }
    })
    // Unable to compare promise directly for some reason, so comparing functions
    expect(dispatchedResult.then).to.be.equal(promiseDispatched.then)
  })

  it('resolves the original promise results from dispatch', () => {
    let promiseDispatched = Promise.resolve(foobar)

    let dispatchedResult = dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      meta: {
        promise: promiseDispatched,
        foo2: 'bar2'
      }
    })
    expect(dispatchedResult).to.eventually.equal(foobar)
  })

  it('reject the original promise from dispatch', () => {
    let promiseDispatched = Promise.reject(err)

    let dispatchedResult = dispatch({
      type: 'ACTION_TYPE_REJECT',
      meta: {
        promise: promiseDispatched,
        foo2: 'bar2'
      }
    })
    expect(dispatchedResult).to.eventually.be.rejectedWith(err)
  })

  it('ignores non-promises', async () => {
    dispatch(foobar)
    expect(next.calledOnce).to.be.true
    expect(next.firstCall.args[0]).to.equal(foobar)

    dispatch({ type: 'ACTION_TYPE', payload: foobar })
    expect(next.calledTwice).to.be.true
    expect(next.secondCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: foobar
    })
  })

  it('starts async dispatches from beginning of middleware chain', async () => {
    dispatch({ type: GIVE_ME_META })
    dispatch({ type: GIVE_ME_META })
    expect(next.args.map(args => args[0].meta)).to.eql([
      'here you go',
      'here you go'
    ])
  })
})
