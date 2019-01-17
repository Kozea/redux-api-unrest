import deepEqual from 'deep-equal'
import isoFetch from 'isomorphic-fetch'
import { compile } from 'path-to-regexp'
import { stringify } from 'qs'

import { AbortController, patchFetchMaybe } from './ponyfill'
import { isEmpty } from './utils'

export const apiUnrestPrefix = '@@api-unrest'
export const methods = ['get', 'put', 'post', 'patch', 'delete']
export const initialEndpointState = {
  objects: [],
  metadata: {},
  loading: false,
  error: null,
  lastFetch: null,
  lastFetchParameters: null,
}

export const httpError = (code, description, json) => {
  const error = new Error(`[${code}] - ${description}`)
  error.name = 'HttpError'
  error.code = code
  error.description = description
  error.json = json
  return error
}

export default class ApiUnrest {
  constructor(
    routes,
    // The following prefix must be the redux mount point to use cache
    options
  ) {
    // Set default options
    options = {
      prefix: 'api',
      rootPath: () => '',
      cache: null,
      JWTStorage: false,
      errorHandler: () => true,
      apiRoot: state => state[this.prefix],
      fetch: isoFetch,
      ...options,
    }
    this.prefix = options.prefix
    this.rootPath = options.rootPath
    this.cache = options.cache
    this.storage = null // eslint-disable-next-line no-unused-vars
    this.apiRoot = options.apiRoot
    this.errorHandler = options.errorHandler
    if (options.JWTStorage) {
      if (options.JWTStorage === true) {
        if (typeof localStorage !== 'undefined') {
          this.storage = localStorage
        }
      } else {
        this.storage = options.JWTStorage
      }
    }
    this.fetch = patchFetchMaybe(options.fetch)

    this.routes = { ...routes }
    this.fetches = {}
    this.promises = {}
    this.events = this.getEvents(routes)
    this.actions = this.getActions(routes)
    this.reducers = this.getReducers(routes)
  }

  getEvents(routes) {
    return Object.keys(routes).reduce((events, endpoint) => {
      const eventPath = `${apiUnrestPrefix}/${this.prefix}/${endpoint}`
      events[endpoint] = {
        fetch: `${eventPath}/FETCH`,
        success: `${eventPath}/SUCCESS`,
        error: `${eventPath}/ERROR`,
        abort: `${eventPath}/ABORT`,
        cache: `${eventPath}/CACHE`,
        reset: `${eventPath}/RESET`,
      }
      return events
    }, {})
  }

  getActions(routes) {
    // For each routes return a map: endpoint -> methods -> thunk -> fetch
    return Object.entries(routes).reduce((actions, [endpoint, path]) => {
      const urlFormatter = compile(`/${path}`)
      actions[endpoint] = methods.reduce(
        (routeActions, method) => {
          routeActions[method] = (payload = {}, force = false) =>
            this.fetchThunk(
              endpoint,
              urlFormatter,
              {},
              method.toUpperCase(),
              payload,
              force
            )
          routeActions[`${method}Item`] = (
            urlParameters,
            payload = {},
            force = false
          ) => {
            if (!urlParameters || isEmpty(urlParameters)) {
              throw new Error(
                `${method}Item on ${
                  this.prefix
                }.${endpoint} called without parameters`
              )
            }
            return this.fetchThunk(
              endpoint,
              urlFormatter,
              urlParameters,
              method.toUpperCase(),
              payload,
              force
            )
          }
          routeActions.force[method] = (payload = {}) =>
            routeActions[method](payload, true)
          routeActions.force[`${method}Item`] = (urlParameters, payload = {}) =>
            routeActions[`${method}Item`](urlParameters, payload, true)
          return routeActions
        },
        { force: {} }
      )
      actions[endpoint].reset = () => dispatch => {
        if (this.fetches[endpoint]) {
          this.fetches[endpoint].abort()
        }
        dispatch({ type: this.events[endpoint].reset })
      }
      return actions
    }, {})
  }

  getReducers(routes) {
    return Object.keys(routes).reduce((reducers, endpoint) => {
      reducers[endpoint] = (state = initialEndpointState, action) => {
        switch (action.type) {
          case this.events[endpoint].fetch:
            return {
              ...state,
              loading: true,
              error: null,
              metadata: action.metadata,
            }
          case this.events[endpoint].success:
            return {
              ...state,
              objects: action.objects
                ? this.mergeObjects(
                    action.method,
                    state.objects,
                    action.objects,
                    action.metadata.primary_keys,
                    action.batch
                  )
                : state.objects,
              metadata: action.metadata,
              loading: false,
              error: null,
              lastFetch: action.method === 'GET' ? Date.now() : state.lastFetch,
              lastFetchParameters:
                action.method === 'GET'
                  ? action.parameters
                  : state.lastFetchParameters,
            }
          case this.events[endpoint].error:
            return {
              ...state,
              loading: false,
              error: action.error,
            }
          case this.events[endpoint].abort:
            return {
              ...state,
              loading: false,
              error: null,
            }
          case this.events[endpoint].cache:
            return {
              ...state,
              loading: false,
            }
          case this.events[endpoint].reset:
            return {
              ...initialEndpointState,
            }
          default:
            return state
        }
      }
      return reducers
    }, {})
  }

  mergeObjects(method, olds, objects, pks, batch) {
    // An equality based on primary keys
    const pkEqual = (o1, o2) => pks.every(pk => o1[pk] === o2[pk])
    // A filter that only returns objects that are not in the given list
    const notIn = objs => obj => !objs.some(o => pkEqual(o, obj))
    switch (method) {
      case 'GET':
        // In case of a GET we simply use the new objects
        return [...objects]
      case 'POST':
        // In case of a POST we concatenate the new data to the old
        return [...olds, ...objects]
      case 'PUT':
        // In case of a PUT we replace all if it's a batch
        if (batch) {
          // If there's no path variables it's a batch PUT so
          return [...objects]
        }
      // In case of a PUT one we replace the one that changed
      // Since it's exactly like PATCH we are falling through
      // eslint-disable-next-line no-fallthrough
      case 'PATCH':
        // In case of a PATCH we replace the element that changed
        // Old objects without the updated new objects + the new objects
        return [...olds.filter(notIn(objects)), ...objects]
      case 'DELETE':
        // In case of a DELETE we remove all
        return [...olds.filter(notIn(objects))]
    }
  }

  fetchThunk(endpoint, urlFormatter, urlParameters, method, payload, force) {
    return async (dispatch, getState) => {
      const query =
        method === 'GET' && !isEmpty(payload)
          ? stringify(payload, {
              addQueryPrefix: true,
              strictNullHandling: true,
              indices: false,
            })
          : ''
      const url = this.rootPath() + urlFormatter(urlParameters) + query
      // In case of a get request, add get parameters to parameters
      // (This prevents cache on different url queries: ?offset=0 vs ?offset=10)
      const parameters =
        method === 'GET' ? { ...urlParameters, ...payload } : urlParameters
      const handleError = error => {
        // If error handler returns true, the error will propagate
        if (
          this.errorHandler(
            error,
            {
              endpoint,
              url,
              urlParameters,
              method,
              payload,
              prefix: this.prefix,
            },
            dispatch,
            getState
          )
        ) {
          throw error
        }
      }
      const state = getState()
      const { loading } = this.apiRoot(state)[endpoint]
      if (loading) {
        if (force) {
          this.fetches[endpoint].abort()
        } else {
          // Waiting for AbortController api
          // https://developer.mozilla.org/en-US/docs/Web/API/AbortController
          const alreadyLoadingError = new Error('Already loading')
          alreadyLoadingError.name = 'AlreadyLoadingError'
          handleError(alreadyLoadingError)
          return { status: 'failed', error: alreadyLoadingError }
        }
      }
      // Here we go
      dispatch({
        type: this.events[endpoint].fetch,
        metadata: {
          url,
          method,
          parameters: urlParameters,
          payload,
        },
      })
      // Prevent cache on forced request
      if (!loading && !force && this.cache && method === 'GET') {
        const endpointState = this.apiRoot(state)[endpoint]
        const { lastFetch, lastFetchParameters } = endpointState
        if (
          lastFetch &&
          Date.now() - lastFetch < this.cache &&
          (lastFetchParameters === null ||
            deepEqual(lastFetchParameters, parameters))
        ) {
          dispatch({ type: this.events[endpoint].cache })
          return {
            status: 'cache',
            objects: endpointState.objects,
            metadata: endpointState.metadata,
          }
        }
      }
      try {
        this.fetches[endpoint] = new AbortController()
        this.promises[endpoint] = this.fetchHandler(
          url,
          method,
          payload,
          this.fetches[endpoint].signal
        )
        const { objects, ...metadata } = await this.promises[endpoint]
        dispatch({
          type: this.events[endpoint].success,
          objects,
          metadata,
          method,
          parameters,
          // This request was a batch if there were no url parameters
          batch: isEmpty(urlParameters),
        })
        return { status: 'success', objects, metadata }
      } catch (error) {
        if (error.name === 'AbortError') {
          dispatch({
            type: this.events[endpoint].abort,
          })
          return { status: 'aborted' }
        }
        dispatch({
          type: this.events[endpoint].error,
          error: error.toString(),
        })
        handleError(error)
        return { status: 'failed', error }
      } finally {
        delete this.fetches[endpoint]
        delete this.promises[endpoint]
      }
    }
  }

  async fetchHandler(url, method, payload, signal) {
    const opts = {
      method,
      headers: {
        Accept: 'application/json',
      },
      signal,
    }
    if (method !== 'GET' && !isEmpty(payload)) {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(payload)
    }
    const response = await this._fetch(url, opts)
    if (response.status > 300 || response.status < 200) {
      if (response.headers.get('Content-Type') !== 'application/json') {
        const text = await response.text()
        throw httpError(response.status, text)
      }
      const json = await response.json()
      if (response.status === 404 && json.occurences === 0) {
        return json
      }
      throw httpError(response.status, json.message || json.description, json)
    }
    if (response.headers.get('Content-Type') !== 'application/json') {
      // This could happen if used outside of redux context
      return response.blob()
    }
    return { ...(await response.json()), code: response.status }
  }

  onBeforeFetchHook({ url, opts }) {
    if (this.storage) {
      let jwt = null
      try {
        jwt = this.storage.getItem('jwt')
      } catch (e) {
        // Safari private mode
        console && console.warn(e)
      }
      if (jwt) {
        opts.headers.Authorization = `Bearer ${jwt}`
      }
    }
    return { url, opts }
  }

  async _fetch(url, opts) {
    const hookParams = this.onBeforeFetchHook({ url, opts })
    const response = await this.fetch(hookParams.url, hookParams.opts)
    return this.onAfterFetchHook(hookParams, response)
  }

  // eslint-disable-next-line no-unused-vars
  onAfterFetchHook({ url, opts }, response) {
    if (this.storage) {
      if (response.status === 401) {
        try {
          this.storage.removeItem('jwt')
        } catch (e) {
          // Safari private mode
          console && console.warn(e)
        }
      } else if (response.headers.get('Authorization')) {
        try {
          this.storage.setItem('jwt', response.headers.get('Authorization'))
        } catch (e) {
          // Safari private mode
          console && console.warn(e)
        }
      }
    }
    return response
  }
}
