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

export default function optimistPromiseMiddleware(resolvedName = RESOLVED_NAME, rejectedName = REJECTED_NAME) {
  [RESOLVED_NAME, REJECTED_NAME] = [resolvedName, rejectedName];
  let nextTransactionID = 0;
  return ({ dispatch }) => next => action => {

    if (!isFSA(action) || !action.payload || !isPromise(action.payload.promise)) {
      return next(action);
    }

    const isOptimist = (action.meta || {}).optimist;

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
      },
      meta: {
        ...action.meta
      }
    };

    if (isOptimist) {
      // Adding optimistic meta
      newAction.optimist = {type: BEGIN, id: transactionID};
      delete newAction.meta.optimist;
    }

    if (Object.keys(newAction.meta).length === 0) {
      delete newAction.meta;
    }

    if (Object.keys(newAction.payload).length === 1) {
      // No arguments beside promise, remove all payload
      delete newAction.payload;
    } else {
      // Other arguments, delete promise and optimist only
      delete newAction.payload.promise;
    }

    const skipOptimist = (action.meta || {}).skipOptimist;

    if (!skipOptimist) {
      dispatch(newAction);
    }

    // (2) Listen to promise and dispatch payload with new actionName
    return action.payload.promise.then(
      (result) => {
        const actionToDispatch = {
          type: resolve(action.type),
          payload: result,
          meta: {
            ...newAction.meta,
            ...newAction.payload
          }
        };
        if (isOptimist) {
          actionToDispatch.optimist = {type: COMMIT, id: transactionID};
        }
        dispatch(actionToDispatch);
        return result;
      },
      (error) => {
        const actionToDispatch = {
          type: reject(action.type),
          payload: error,
          meta: {
            ...newAction.meta,
            ...newAction.payload
          }
        };
        if (isOptimist) {
          actionToDispatch.optimist = {type: REVERT, id: transactionID};
        }
        dispatch(actionToDispatch);
        return error;
      }
    );
  };
}
