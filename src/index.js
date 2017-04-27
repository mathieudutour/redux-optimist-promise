import { isFSA } from 'flux-standard-action'

function isPromise (val) {
  return val && typeof val.then === 'function'
}

let [RESOLVED_NAME, REJECTED_NAME] = ['_RESOLVED', '_REJECTED']
const BEGIN = 'BEGIN'
const COMMIT = 'COMMIT'
const REVERT = 'REVERT'

export function resolve (actionName) {
  return actionName + RESOLVED_NAME
}

export function reject (actionName) {
  return actionName + REJECTED_NAME
}

export function unresolve (resolvedActionName) {
  return resolvedActionName.split(RESOLVED_NAME)[0]
}

export function unreject (rejectedActionName) {
  return rejectedActionName.split(REJECTED_NAME)[0]
}

export function isResolvedAction (resolvedActionName) {
  return unresolve(resolvedActionName) !== resolvedActionName
}

export function isRejectedAction (rejectedActionName) {
  return unreject(rejectedActionName) !== rejectedActionName
}

export function isThenAction (thenActionName) {
  return isResolvedAction(thenActionName) || isRejectedAction(thenActionName)
}

export default function optimistPromiseMiddleware (throwOnReject = true, resolvedName = RESOLVED_NAME, rejectedName = REJECTED_NAME) {
  [RESOLVED_NAME, REJECTED_NAME] = [resolvedName, rejectedName]
  let nextTransactionID = 0
  return ({ dispatch }) => (next) => (action) => {
    if (!isFSA(action) || !action.meta || !isPromise(action.meta.promise)) {
      return next(action)
    }

    const isOptimist = action.meta.optimist

    let transactionID

    if (isOptimist) {
      transactionID = nextTransactionID++
    }

    // (1) Dispatch actionName with meta with arguments apart from promise

    // Clone original action
    let newAction = {
      ...action,
      meta: {
        ...action.meta
      }
    }

    if (isOptimist) {
      // Adding optimistic meta
      newAction.optimist = {type: BEGIN, id: transactionID}
      delete newAction.meta.optimist
    }

    if (Object.keys(newAction.meta).length === 1) {
      delete newAction.meta
    } else {
      // Other arguments, delete promise and optimist only
      delete newAction.meta.promise
    }

    const skipOptimist = action.meta.skipOptimist

    if (!skipOptimist) {
      next(newAction)
    }

    // Create a base for the next action containing the metadata.
    let nextActionBase = {
      meta: {
        ...newAction.meta,
        payload: newAction.payload
      }
    }

    if (!nextActionBase.meta.payload) {
      // No payload, no need to include them in the meta.
      delete nextActionBase.meta.payload
    }
    if (Object.keys(nextActionBase.meta).length === 0) {
      // No meta was included either, remove all meta.
      delete nextActionBase.meta
    }

    // (2) Listen to promise and dispatch payload with new actionName
    return action.meta.promise.then(
      (result) => {
        const actionToDispatch = {
          type: resolve(action.type),
          payload: result,
          ...nextActionBase
        }
        if (isOptimist) {
          actionToDispatch.optimist = {type: COMMIT, id: transactionID}
        }
        dispatch(actionToDispatch)
        return result
      }).catch(
      (error) => {
        const actionToDispatch = {
          type: reject(action.type),
          payload: error,
          ...nextActionBase
        }
        if (isOptimist) {
          actionToDispatch.optimist = {type: REVERT, id: transactionID}
        }
        dispatch(actionToDispatch)
        if (throwOnReject) {
          throw error
        }
      }
    )
  }
}
