import middleware, { resolve, reject, unresolve, unreject } from '../src/'

describe('Default name values', () => {
  it('returns the reject and resolve strings', () => {
    expect(resolve('MY_ACTION')).to.equal('MY_ACTION_RESOLVED')
    expect(reject('MY_ACTION')).to.equal('MY_ACTION_REJECTED')
  })
  it('returns the actionType from the rejected and resolved strings', () => {
    expect(unresolve('MY_ACTION_RESOLVED')).to.equal('MY_ACTION')
    expect(unreject('MY_ACTION_REJECTED')).to.equal('MY_ACTION')
  })
})

describe('Custom name values', () => {
  beforeEach(() => {
    middleware('_MY_RESOLVED', '_MY_REJECTED')
  })
  it('returns the reject and resolve strings', () => {
    expect(resolve('MY_ACTION')).to.equal('MY_ACTION_MY_RESOLVED')
    expect(reject('MY_ACTION')).to.equal('MY_ACTION_MY_REJECTED')
  })
  it('returns the actionType from the rejected and resolved strings', () => {
    expect(unresolve('MY_ACTION_MY_RESOLVED')).to.equal('MY_ACTION')
    expect(unreject('MY_ACTION_MY_REJECTED')).to.equal('MY_ACTION')
  })
})
