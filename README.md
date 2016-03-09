redux-optimist-promise
=============

[![build status](https://img.shields.io/travis/mathieudutour/redux-optimist-promise/master.svg?style=flat-square)](https://travis-ci.org/mathieudutour/redux-optimist-promise)
[![npm version](https://img.shields.io/npm/v/redux-optimist-promise.svg?style=flat-square)](https://www.npmjs.com/package/redux-optimist-promise)

[FSA](https://github.com/acdlite/flux-standard-action)-compliant promise [middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) middleware for Redux and automatically add necessary for [redux-optimist](https://github.com/ForbesLindesay/redux-optimist).

```js
npm install --save redux-optimist-promise
```

## Usage in middlewares

First, import the middleware creator and include it in `applyMiddleware` when creating the Redux store. **You need to call it as a function (See later why on configuration section below):**

```js
import optimistPromiseMiddleware from 'redux-optimist-promise';

composeStoreWithMiddleware = applyMiddleware(
	optimistPromiseMiddleware()
)(createStore);

```

To use the middleware, dispatch a `promise` property and optional additional properties within the `meta` of the action and specify the action `type` string as you normally do.

To add the optimist tag, add a `optimist` field in the `meta` of the action.

The pending action is dispatched immediately, with `type` the same as the original dispatching action with all original `meta` properties apart from the `promise` as the meta object (those are useful for optimistic updates). The resolve action is dispatched only if the promise is resolved, e.g., if it was successful; and the rejected action is dispatched only if the promise is rejected, e.g., if an error occurred.

Both fulfilled actions (resolved and rejected) will be dispatched with the result of the promise as the payload object and all other remaining properties will be dispatched inside the `meta` property. More specifically, in the case of a rejected promise, an `error` is returned in the payload property. Also those fulfilled actions will have the original `type` added by a suffix (default is `_RESOLVED` for resolved and `_REJECTED` for rejected).

Example:

The below action creator, when triggered `dispatch(addTodo('use redux-optimist-promise'))`

```js
export function addTodo(text) {
	return {
		type: 'ADD_TODO',
		payload: {
			text
		},
		meta: {
			promise: addTodoPromise(text),
			optimist: true
		}
	};
}
```

will dispatch immediately
```js
{
	type: 'ADD_TODO',
	payload: {
		text: 'use redux-optimist-promise'
	},
	optimist: {type: 'BEGIN', id: transactionID}
}
```

Assuming promise resolves with `{ id: '1', name: 'use redux-optimist-promise' }`, then it will dispatch
```js
{
	type: 'ADD_TODO_RESOLVED',
	payload: { id: '1', name: 'use redux-optimist-promise' },
	meta: {
		payload: {
			text: 'use redux-optimist-promise'
		}
	},
	optimist: {type: 'COMMIT', id: transactionID}
}
```

Assuming promise rejects with `Error` object, then it will dispatch
```js
{
	type: 'ADD_TODO_REJECTED',
	payload: Error,
	meta: {
		payload: {
			text: 'use redux-optimist-promise'
		}
	},
	optimist: {type: 'REVERT', id: transactionID}
}
```

The middleware also returns the original promise, so you can listen to it and act accordingly from your component if needed (for example redirecting to a new route).

The middleware doesn't include the original promise in the 3 processed actions as it is not useful in the reducers - it is a bad practice to store promises in the state as the state should be serializable.

## Configuration

You can configure the string being added to the action type when resolved or rejected by declaring it when initializing the middleware, so considering the example above, if you do

```js
import optimistPromiseMiddleware from 'redux-optimist-promise';

composeStoreWithMiddleware = applyMiddleware(
	optimistPromiseMiddleware('_MY_RESOLVED', '_MY_REJECTED')
)(createStore);

```

then resolved/rejected promised will trigger actions as `'LOAD_USER_MY_RESOLVED'` and `'LOAD_USER_MY_REJECTED'` instead of the default ones `'LOAD_USER_RESOLVED'` and `'LOAD_USER_REJECTED'`.

## License

  MIT
