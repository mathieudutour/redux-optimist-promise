import test from 'ava'
import optimistPromiseMiddleware, { resolve, reject } from '../src/'
import { spy } from 'sinon'

function noop () {}
const GIVE_ME_META = 'GIVE_ME_META'
function metaMiddleware () {
  return (next) => (action) =>
    action.type === GIVE_ME_META
      ? next({ ...action, meta: 'here you go' })
      : next(action)
}

test.beforeEach((t) => {
  t.context.next = spy()
  t.context.dispatch = function d (action) {
    const store = { dispatch: d, getState: noop }
    return metaMiddleware()(optimistPromiseMiddleware()(store)(t.context.next))(action)
  }
  t.context.foobar = { foo: 'bar' }
  t.context.err = new Error()
})

test('dispatches first action before promise wtesthout arguments', (t) => {
  t.context.dispatch({
    type: 'ACTION_TYPE',
    meta: {
      promise: new Promise(() => {})
    }
  })

  t.true(t.context.next.calledOnce)

  t.same(t.context.next.firstCall.args[0], {
    type: 'ACTION_TYPE'
  })
})

test('dispatches first action before promise wtesth arguments', (t) => {
  t.context.dispatch({
    type: 'ACTION_TYPE',
    payload: {
      foo: 'bar'
    },
    meta: {
      promise: new Promise(() => {})
    }
  })

  t.true(t.context.next.calledOnce)

  t.same(t.context.next.firstCall.args[0], {
    type: 'ACTION_TYPE',
    payload: {
      foo: 'bar'
    }
  })
})

test('dispatches resolve action wtesth arguments', async (t) => {
  await t.context.dispatch({
    type: 'ACTION_TYPE_RESOLVE',
    payload: {
      foo2: 'bar2'
    },
    meta: {
      promise: Promise.resolve(t.context.foobar)
    }
  })

  t.true(t.context.next.calledTwice)

  t.same(t.context.next.secondCall.args[0], {
    type: resolve('ACTION_TYPE_RESOLVE'),
    payload: t.context.foobar,
    meta: {
      payload: {
        foo2: 'bar2'
      }
    }
  })
})

test('dispatches reject action wtesth arguments', async (t) => {
  try {
    await t.context.dispatch({
      type: 'ACTION_TYPE_REJECT',
      payload: {
        foo3: 'bar3',
        foo4: 'bar4'
      },
      meta: {
        promise: Promise.reject(t.context.err)
      }
    })
  } catch (e) {
    // We're not interested in the rejection. We just need to watest until all
    // dispatching is done.
    true
  }

  t.true(t.context.next.calledTwice)

  t.same(t.context.next.secondCall.args[0], {
    type: reject('ACTION_TYPE_REJECT'),
    payload: t.context.err,
    meta: {
      payload: {
        foo3: 'bar3',
        foo4: 'bar4'
      }
    }
  })
})

test('does not overwrteste any meta arguments', async (t) => {
  await t.context.dispatch({
    type: 'ACTION_TYPE_RESOLVE',
    payload: {
      foo2: 'bar2'
    },
    meta: {
      promise: Promise.resolve(t.context.foobar),
      foo3: 'bar3'
    }
  })

  t.true(t.context.next.calledTwice)

  t.same(t.context.next.secondCall.args[0], {
    type: resolve('ACTION_TYPE_RESOLVE'),
    payload: t.context.foobar,
    meta: {
      foo3: 'bar3',
      payload: {
        foo2: 'bar2'
      }
    }
  })
})

test('does not include empty meta payload attribute', async (t) => {
  await t.context.dispatch({
    type: 'ACTION_TYPE_RESOLVE',
    meta: {
      promise: Promise.resolve(t.context.foobar)
    }
  })

  t.true(t.context.next.calledTwice)

  t.same(t.context.next.secondCall.args[0], {
    type: resolve('ACTION_TYPE_RESOLVE'),
    payload: t.context.foobar
  })
})

test('returns the original promise from dispatch', (t) => {
  let promiseDispatched = new Promise(() => {})

  let dispatchedResult = t.context.dispatch({
    type: 'ACTION_TYPE_RESOLVE',
    meta: {
      promise: promiseDispatched,
      foo2: 'bar2'
    }
  })
  // Unable to compare promise directly for some reason, so comparing functions
  t.is(dispatchedResult.then, promiseDispatched.then)
})

test('resolves the original promise results from dispatch', async (t) => {
  let promiseDispatched = Promise.resolve(t.context.foobar)

  let dispatchedResult = await t.context.dispatch({
    type: 'ACTION_TYPE_RESOLVE',
    meta: {
      promise: promiseDispatched,
      foo2: 'bar2'
    }
  })
  t.same(dispatchedResult, t.context.foobar)
})

test('reject the original promise from dispatch', async (t) => {
  let promiseDispatched = Promise.reject(t.context.err)

  try {
    await t.context.dispatch({
      type: 'ACTION_TYPE_REJECT',
      meta: {
        promise: promiseDispatched,
        foo2: 'bar2'
      }
    })
  } catch (e) {
    t.same(e, t.context.err)
  }
})

test('ignores non-promises', async (t) => {
  t.context.dispatch(t.context.foobar)
  t.true(t.context.next.calledOnce)
  t.same(t.context.next.firstCall.args[0], t.context.foobar)

  t.context.dispatch({ type: 'ACTION_TYPE', payload: t.context.foobar })
  t.true(t.context.next.calledTwice)
  t.same(t.context.next.secondCall.args[0], {
    type: 'ACTION_TYPE',
    payload: t.context.foobar
  })
})

test('starts async dispatches from beginning of middleware chain', async (t) => {
  t.context.dispatch({ type: GIVE_ME_META })
  t.context.dispatch({ type: GIVE_ME_META })
  t.same(t.context.next.args.map((args) => args[0].meta), [
    'here you go',
    'here you go'
  ])
})
