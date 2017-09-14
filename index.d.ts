/// <reference types="redux" />

export = ReduxOptimistPromise

declare namespace ReduxOptimistPromise {
  export function resolve(actionName: string): string
  export function unresolve(actionName: string): string

  export function reject(actionName: string): string
  export function unreject(actionName: string): string

  export function isResolvedAction(actionName: string): boolean
  export function isRejectedAction(actionName: string): boolean
  export function isThenAction(actionName: string): boolean

  export default function(options?: {throwOnReject?: boolean, resolvedName?: string, rejectedName?: string}): Redux.Middleware
}
