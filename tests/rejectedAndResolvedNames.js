import middleware, { resolve, reject, unresolve, unreject, isThenAction, isResolvedAction, isRejectedAction } from '../src/'

describe('Default name values', () => {
  it('returns the reject and resolve strings', () => {
    expect(resolve('MY_ACTION')).to.equal('MY_ACTION_RESOLVED')
    expect(reject('MY_ACTION')).to.equal('MY_ACTION_REJECTED')
  })
  it('returns the actionType from the rejected and resolved strings', () => {
    expect(unresolve('MY_ACTION_RESOLVED')).to.equal('MY_ACTION')
    expect(unreject('MY_ACTION_REJECTED')).to.equal('MY_ACTION')
  })
  it('returns wether the actionType is a rejected or resolved strings', () => {
    expect(isResolvedAction('MY_ACTION_RESOLVED')).to.equal(true)
    expect(isThenAction('MY_ACTION_RESOLVED')).to.equal(true)
    expect(isRejectedAction('MY_ACTION_REJECTED')).to.equal(true)
    expect(isThenAction('MY_ACTION_REJECTED')).to.equal(true)
    expect(isThenAction('MY_ACTION')).to.equal(false)
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
  it('returns wether the actionType is a rejected or resolved strings', () => {
    expect(isResolvedAction('MY_ACTION_MY_RESOLVED')).to.equal(true)
    expect(isThenAction('MY_ACTION_MY_RESOLVED')).to.equal(true)
    expect(isRejectedAction('MY_ACTION_MY_REJECTED')).to.equal(true)
    expect(isThenAction('MY_ACTION_MY_REJECTED')).to.equal(true)
    expect(isThenAction('MY_ACTION')).to.equal(false)
  })
})
