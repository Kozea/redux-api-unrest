import {
  AbortController as AbortControllerPonyfill,
  abortableFetch,
} from 'abortcontroller-polyfill/dist/cjs-ponyfill'

// Setting up AbortController
const _self = typeof self === 'undefined' ? global : self
const hasAbortController = !!_self.AbortController
export const AbortController = hasAbortController
  ? _self.AbortController
  : AbortControllerPonyfill

export const patchFetchMaybe = fetch =>
  hasAbortController ? fetch : abortableFetch(fetch).fetch
