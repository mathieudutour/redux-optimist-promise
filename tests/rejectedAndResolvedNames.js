import test from 'ava'
import middleware, { resolve, reject, unresolve, unreject, isThenAction, isResolvedAction, isRejectedAction } from '../src/'

test('Default name values', (t) => {
  t.is(resolve('MY_ACTION'), 'MY_ACTION_RESOLVED')
  t.is(reject('MY_ACTION'), 'MY_ACTION_REJECTED')
  t.is(unresolve('MY_ACTION_RESOLVED'), 'MY_ACTION')
  t.is(unreject('MY_ACTION_REJECTED'), 'MY_ACTION')
  t.is(isResolvedAction('MY_ACTION_RESOLVED'), true)
  t.is(isThenAction('MY_ACTION_RESOLVED'), true)
  t.is(isRejectedAction('MY_ACTION_REJECTED'), true)
  t.is(isThenAction('MY_ACTION_REJECTED'), true)
  t.is(isThenAction('MY_ACTION'), false)
})

test('Custom name values', (t) => {
  middleware('_MY_RESOLVED', '_MY_REJECTED')

  t.is(resolve('MY_ACTION'), 'MY_ACTION_MY_RESOLVED')
  t.is(reject('MY_ACTION'), 'MY_ACTION_MY_REJECTED')
  t.is(unresolve('MY_ACTION_MY_RESOLVED'), 'MY_ACTION')
  t.is(unreject('MY_ACTION_MY_REJECTED'), 'MY_ACTION')
  t.is(isResolvedAction('MY_ACTION_MY_RESOLVED'), true)
  t.is(isThenAction('MY_ACTION_MY_RESOLVED'), true)
  t.is(isRejectedAction('MY_ACTION_MY_REJECTED'), true)
  t.is(isThenAction('MY_ACTION_MY_REJECTED'), true)
  t.is(isThenAction('MY_ACTION'), false)
})
