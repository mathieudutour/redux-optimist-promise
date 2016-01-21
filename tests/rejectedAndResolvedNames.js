import { resolve, reject, unresolve, unreject } from '../src/';

describe('before promiseMiddleware is called', () => {
  it('returns the reject and resolve strings with default values', () => {
    expect(resolve('MY_ACTION')).to.equal('MY_ACTION_RESOLVED');
    expect(reject('MY_ACTION')).to.equal('MY_ACTION_REJECTED');
  });
  it('returns the actionType from the rejected and resolved strings with default values', () => {
    expect(unresolve('MY_ACTION_RESOLVED')).to.equal('MY_ACTION');
    expect(unreject('MY_ACTION_REJECTED')).to.equal('MY_ACTION');
  });
});
