redux-optimist-promise
=============

[![build status](https://img.shields.io/travis/mathieudutour/redux-optimist-promise/master.svg?style=flat-square)](https://travis-ci.org/mathieudutour/redux-optimist-promise)
[![npm version](https://img.shields.io/npm/v/redux-optimist-promise.svg?style=flat-square)](https://www.npmjs.com/package/redux-optimist-promise)

[FSA](https://github.com/acdlite/flux-standard-action)-compliant promise [middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) middleware for Redux and optimistically apply actions that can be later commited or reverted with simple behaviour with minimal boilerplate declarations.

```js
npm install --save redux-optimist-promise
```

## Usage in middlewares

First, import the middleware creator and include it in `applyMiddleware` when creating the Redux store. **You need to call it as a function (See later why on configuration section below):**

```js
import {optimistPromiseMiddleware} from 'redux-optimist-promise';

composeStoreWithMiddleware = applyMiddleware(
  optimistPromiseMiddleware()
)(createStore);

```

To use the middleware, dispatch a `promise` property and optional additional properties within the `payload` of the action and specify the action `type` string as you normally do.

The pending action is dispatched immediately, with `type` the same as the original dispatching action with all original `payload` properties apart from the `promise` as the payload object (those are useful for optimistic updates). The resolve action is dispatched only if the promise is resolved, e.g., if it was successful; and the rejected action is dispatched only if the promise is rejected, e.g., if an error occurred.

Both fullfilled actions (resolved and rejected) will be dispatched with the result of the promise as the payload object and all other remaining properties will be dispatched inside the `meta` property. More specifically, in the case of a rejected promise, an `error` is returned in the payload property. Also those fullfiled actions will have the original `type` added by a suffix (default is `_RESOLVED` for resolved and `_REJECTED` for rejected).

Example:

The below action creator, when triggered `dispatch(loadUser('mathieudutour'))`

```js
export function loadUser(username) {
  return {
    type: 'LOAD_USER',
    payload: {
      promise: loadUserServiceAndReturnPromise(username)
      username
    }
  };
}
```

will dispatch immediatelly
```js
{
	type: 'LOAD_USER',
	payload: {
		username: 'mathieudutour'
	}
}
```

Assuming promise resolves with `{ id: '1', name: 'Mathieu Dutour' }`, then it will dispatch
```js
{
	type: 'LOAD_USER_RESOLVED',
	payload: { id: '1', name: 'Mathieu Dutour' },
	meta: {
		username: 'mathieudutour'
	}
}
```

Assuming promise rejects with `Error` object, then it will dispatch
```js
{
	type: 'LOAD_USER_REJECTED',
	payload: Error,
	meta: {
		username: 'mathieudutour'
	}
}
```

The middleware also returns the original promise, so you can listen to it and act accordingly from your component if needed (for example redirecting to a new route).

The middleware doesn't include the original promise in the 3 processed actions as it is not useful in the reducers - it is a bad practice to store promises in the state as the state should be serializable.

### Usage in reducers

### Step 1: Mark your optimistic actions with the `optimist` key

```js
export function addTodo(text) {
  return {
    type: 'ADD_TODO',
    payload: {
      promise: loadTodoServiceAndReturnPromise(text),
      text,
    },
    optimist: true
  };
}
```

### Step 2: Wrap your top level reducer in redux-optimist-promise

#### `reducers/index.js`

```js
import { optimistPromiseReducer } from 'redux-optimist-promise';
import { combineReducers } from 'redux';
import todos from './todos';
import status from './status';

export default optimistPromiseReducer(combineReducers({
  todos,
  status
}));
```

As long as your top-level reducer returns a plain object, you can use optimist.  You don't
have to use `Redux.combineReducers`.

## Configuration

You can configure the string being added to the action type when resolved or rejected by declaring it when initialiazing the middleware, so considering the example above, if you do

```js
import {optimistPromiseMiddleware} from 'redux-optimist-promise';

composeStoreWithMiddleware = applyMiddleware(
  optimistPromiseMiddleware('_MY_RESOLVED', '_MY_REJECTED')
)(createStore);

```

then resolved/rejected promised will trigger actions as `'LOAD_USER_MY_RESOLVED'` and `'LOAD_USER_MY_REJECTED'` instead of the default ones `'LOAD_USER_RESOLVED'` and `'LOAD_USER_REJECTED'`.

## Inspiration

I have tried to mix the best behaviour from both [redux-simple-promise](https://github.com/alanrubin/redux-simple-promise) and [redux-optimist](https://github.com/ForbesLindesay/redux-optimist) projects, avoiding as much as possible additional boilerplate declarations.

Thanks to both projects for inspiration.

---
Licensed MIT. Copyright 2015 Mathieu Dutour.
