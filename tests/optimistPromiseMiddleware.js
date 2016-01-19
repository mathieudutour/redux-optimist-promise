import optimistPromiseMiddleware from '../src/';
import { spy } from 'sinon';
import { resolve, reject } from '../src/';

function noop() {}
const GIVE_ME_META = 'GIVE_ME_META';
function metaMiddleware() {
  return next => action =>
    action.type === GIVE_ME_META
      ? next({ ...action, meta: 'here you go' })
      : next(action);
}

describe('optimsit promise handling middleware', () => {
  let next;
  let dispatch;
  let foobar;
  let err;

  beforeEach(() => {
    next = spy();
    dispatch = function d(action) {
      const store = { dispatch: d, getState: noop };
      return metaMiddleware()(optimistPromiseMiddleware()(store)(next))(action);
    };
    foobar = { foo: 'bar' };
    err = new Error();
  });
  it('dispatches first action before promise with BEGIN optimist tag without meta', () => {
    dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: new Promise(() => {})
      },
      meta: {
        optimist: true
      }
    });

    expect(next.calledOnce).to.be.true;

    expect(next.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      optimist: {type: 'BEGIN', id: 0}
    });
  });

  it('dispatches first action before promise with BEGIN optimist tag with meta', () => {
    dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: new Promise(() => {})
      },
      meta: {
        optimist: true,
        foo: 'bar'
      }
    });

    expect(next.calledOnce).to.be.true;

    expect(next.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      meta: {
        foo: 'bar'
      },
      optimist: {type: 'BEGIN', id: 0}
    });
  });

  it('does NOT dispatch first action before promise if skipOptimist meta', async () => {
    await dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: Promise.resolve(foobar)
      },
      meta: {
        skipOptimist: true
      }
    });

    expect(next.calledOnce).to.be.true;

    expect(next.firstCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE_RESOLVED',
      payload: foobar,
      meta: {
        skipOptimist: true
      }
    });
  });

  it('dispatches resolve action with COMMIT optimist', async () => {
    await dispatch({
      type: 'ACTION_TYPE_RESOLVE',
      payload: {
        promise: Promise.resolve(foobar),
        foo2: 'bar2'
      },
      meta: {
        optimist: true
      }
    });

    expect(next.calledTwice).to.be.true;

    expect(next.secondCall.args[0]).to.deep.equal({
      type: resolve('ACTION_TYPE_RESOLVE'),
      payload: foobar,
      meta: {
        foo2: 'bar2'
      },
      optimist: {type: 'COMMIT', id: 0}
    });
  });

  it('dispatches reject action with REVERT optimist', async () => {
    await dispatch({
      type: 'ACTION_TYPE_REJECT',
      payload: {
        promise: Promise.reject(err),
        foo3: 'bar3',
        foo4: 'bar4'
      },
      meta: {
        optimist: true
      }
    });

    expect(next.calledTwice).to.be.true;

    expect(next.secondCall.args[0]).to.deep.equal({
      type: reject('ACTION_TYPE_REJECT'),
      payload: err,
      meta: {
        foo3: 'bar3',
        foo4: 'bar4'
      },
      optimist: {type: 'REVERT', id: 0}
    });
  });
});
