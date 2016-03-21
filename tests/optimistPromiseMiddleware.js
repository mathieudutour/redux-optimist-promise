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

test('dispatches first action before promise with BEGIN optimist tag without meta', (t) => {
  t.context.dispatch({
    type: 'ACTION_TYPE',
    meta: {
      promise: new Promise(() => {}),
      optimist: true
    }
  })

  t.true(t.context.next.calledOnce)

  t.same(t.context.next.firstCall.args[0], {
    type: 'ACTION_TYPE',
    optimist: {type: 'BEGIN', id: 0}
  })
})

test('dispatches first action before promise with BEGIN optimist tag with meta', (t) => {
  t.context.dispatch({
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

  t.true(t.context.next.calledOnce)

  t.same(t.context.next.firstCall.args[0], {
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

test('does NOT dispatch first action before promise if skipOptimist meta', async (t) => {
  await t.context.dispatch({
    type: 'ACTION_TYPE',
    meta: {
      promise: Promise.resolve(t.context.foobar),
      skipOptimist: true
    }
  })

  t.true(t.context.next.calledOnce)

  t.same(t.context.next.firstCall.args[0], {
    type: 'ACTION_TYPE_RESOLVED',
    payload: t.context.foobar,
    meta: {
      skipOptimist: true
    }
  })
})

test('dispatches resolve action with COMMIT optimist', async (t) => {
  await t.context.dispatch({
    type: 'ACTION_TYPE_RESOLVE',
    payload: {
      foo2: 'bar2'
    },
    meta: {
      promise: Promise.resolve(t.context.foobar),
      optimist: true
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
    },
    optimist: {type: 'COMMIT', id: 0}
  })
})

test('dispatches reject action with REVERT optimist', async (t) => {
  try {
    await t.context.dispatch({
      type: 'ACTION_TYPE_REJECT',
      payload: {
        foo3: 'bar3',
        foo4: 'bar4'
      },
      meta: {
        promise: Promise.reject(t.context.err),
        optimist: true
      }
    })
  } catch (e) {
    // We're not interested in the rejection. We just need to wait until all
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
    },
    optimist: {type: 'REVERT', id: 0}
  })
})
