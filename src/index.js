import { isFSA } from 'flux-standard-action';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

let [RESOLVED_NAME, REJECTED_NAME] = ['_RESOLVED', '_REJECTED'];
const BEGIN = 'BEGIN';
const COMMIT = 'COMMIT';
const REVERT = 'REVERT';

export function resolve(actionName) {
  return actionName + RESOLVED_NAME;
}

export function reject(actionName) {
  return actionName + REJECTED_NAME;
}

export function optimistPromiseMiddleware(resolvedName = RESOLVED_NAME, rejectedName = REJECTED_NAME) {
  [RESOLVED_NAME, REJECTED_NAME] = [resolvedName, rejectedName];
  let nextTransactionID = 0;
  return ({ dispatch }) => next => action => {

    if (!isFSA(action) || !action.payload || !isPromise(action.payload.promise)) {
      return next(action);
    }

    const isOptimist = action.payload.optimist;

    let transactionID;

    if (isOptimist) {
      transactionID = nextTransactionID++;
    }

    // (1) Dispatch actionName with payload with arguments apart from promise

    // Clone original action
    let newAction = {
      type: action.type,
      payload: {
        ...action.payload
      }
    };

    if (isOptimist) {
      // Adding optimistic meta
      newAction.optimist = {type: BEGIN, id: transactionID};
    }

    if (Object.keys(newAction.payload).length === isOptimist ? 2 : 1) {
      // No arguments beside promise, remove all payload
      delete newAction.payload;
    } else {
      // Other arguments, delete promise and optimist only
      delete newAction.payload.promise;
      delete newAction.payload.optimist;
    }

    dispatch(newAction);

    // (2) Listen to promise and dispatch payload with new actionName
    return action.payload.promise.then(
      (result) => {
        dispatch({
          type: resolve(action.type, resolvedName),
          payload: result,
          meta: newAction.payload,
          optimist: isOptimist ? {type: COMMIT, id: transactionID} : false
        });
        return result;
      },
      (error) => {
        dispatch({
          type: reject(action.type, rejectedName),
          payload: error,
          meta: newAction.payload,
          optimist: isOptimist ? {type: REVERT, id: transactionID} : false
        });
        return error;
      }
    );
  };
}
