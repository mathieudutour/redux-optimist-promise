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

    const isOptimist = action.optimist;

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

    if (Object.keys(newAction.payload).length === 1) {
      // No arguments beside promise, remove all payload
      delete newAction.payload;
    } else {
      // Other arguments, delete promise only
      delete newAction.payload.promise;
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

// Array({transactionID: string or null, beforeState: {object}, action: {object}}
let INITIAL_OPTIMIST = [];

function separateState(state) {
  if (!state) {
    return {optimist: INITIAL_OPTIMIST, innerState: state};
  }
  let {optimist = INITIAL_OPTIMIST, ...innerState} = state;
  return {optimist, innerState};
}

function matchesTransaction(action, id) {
  return (
    action.optimist &&
    action.optimist.id === id
  );
}

function validateState(newState, action) {
  if (!newState || typeof newState !== 'object' || Array.isArray(newState)) {
    throw new TypeError(
      'Error while handling "' +
      action.type +
      '": Optimist requires that state is always a plain object.'
    );
  }
}

export function optimistPromiseReducer(fn) {
  function beginReducer(state, action) {
    let {optimist, innerState} = separateState(state);
    optimist = optimist.concat([{beforeState: innerState, action}]);
    innerState = fn(innerState, action);
    validateState(innerState, action);
    return {optimist, ...innerState};
  }
  function commitReducer(state, action) {
    let {optimist, innerState} = separateState(state);
    let newOptimist = [];
    let started = false;
    let committed = false;
    optimist.forEach((entry) => {
      if (started) {
        if (
          entry.beforeState &&
          matchesTransaction(entry.action, action.optimist.id)
        ) {
          committed = true;
          newOptimist.push({action: entry.action});
        } else {
          newOptimist.push(entry);
        }
      } else if (
        entry.beforeState &&
        !matchesTransaction(entry.action, action.optimist.id)
      ) {
        started = true;
        newOptimist.push(entry);
      } else if (
        entry.beforeState &&
        matchesTransaction(entry.action, action.optimist.id)
      ) {
        committed = true;
      }
    });
    if (!committed) {
      console.error('Cannot commit transaction with id "' + action.optimist.id + '" because it does not exist');
    }
    optimist = newOptimist;
    return baseReducer(optimist, innerState, action);
  }
  function revertReducer(state, action) {
    let {optimist, innerState} = separateState(state);
    let newOptimist = [];
    let started = false;
    let gotInitialState = false;
    let currentState = innerState;
    optimist.forEach((entry) => {
      if (
        entry.beforeState &&
        matchesTransaction(entry.action, action.optimist.id)
      ) {
        currentState = entry.beforeState;
        gotInitialState = true;
      }
      if (!matchesTransaction(entry.action, action.optimist.id)) {
        if (
          entry.beforeState
        ) {
          started = true;
        }
        if (started) {
          if (gotInitialState && entry.beforeState) {
            newOptimist.push({
              beforeState: currentState,
              action: entry.action
            });
          } else {
            newOptimist.push(entry);
          }
        }
        if (gotInitialState) {
          currentState = fn(currentState, entry.action);
          validateState(innerState, action);
        }
      }
    });
    if (!gotInitialState) {
      console.error('Cannot revert transaction with id "' + action.optimist.id + '" because it does not exist');
    }
    optimist = newOptimist;
    return baseReducer(optimist, currentState, action);
  }
  function baseReducer(optimist, innerState, action) {
    let _optimist = optimist;
    if (_optimist.length) {
      _optimist = _optimist.concat([{action}]);
    }
    let _innerState = fn(innerState, action);
    validateState(_innerState, action);
    return {_optimist, ..._innerState};
  }

  return (state, action) => {
    if (action.optimist) {
      switch (action.optimist.type) {
      case BEGIN:
        return beginReducer(state, action);
      case COMMIT:
        return commitReducer(state, action);
      case REVERT:
        return revertReducer(state, action);
      default:
        console.error('Unknow optimist type "' + action.optimist.type);
        break;
      }
    }
    let separated = separateState(state);
    return baseReducer(separated.optimist, separated.innerState, action);
  };
}
