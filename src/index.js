import deepEqual from 'deep-equal'
import fetch from 'isomorphic-fetch'
import { compile } from 'path-to-regexp'
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

const rootPrefix = '@@api-unrest'
const methods = ['get', 'put', 'post', 'patch', 'delete']
const initialEndpointState = {
  objects: [],
  metadata: {},
  loading: false,
  error: null,
  lastFetch: null,
  lastFetchParameters: null,
}

const httpError = (code, description) => {
  const error = new Error(`[${code}] - ${description}`)
  error.name = 'HttpError'
  error.code = code
  error.description = description
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
      rootPath: '',
      cache: null,
      JWTStorage: false,
      errorHandler: () => true,
      fetch,
      ...options,
    }
    this.prefix = options.prefix
    this.rootPath = options.rootPath
    this.cache = options.cache
    this.storage = null
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
    this.fetch = options.fetch

    this.events = this._getEvents(routes)
    this.actions = this._getActions(routes)
    this.reducers = this._getReducers(routes)
  }

  _getEvents(routes) {
    return Object.keys(routes).reduce((events, endpoint) => {
      const eventPath = `${rootPrefix}/${this.prefix}/${endpoint}`
      events[endpoint] = {
        fetch: `${eventPath}/FETCH`,
        success: `${eventPath}/SUCCESS`,
        error: `${eventPath}/ERROR`,
        cache: `${eventPath}/CACHE`,
      }
      return events
    }, {})
  }

  _getActions(routes) {
    // For each routes return a map: endpoint -> methods -> thunk -> fetch
    return Object.entries(routes).reduce((actions, [endpoint, path]) => {
      const url = compile(`${this.rootPath}/${path}`)
      actions[endpoint] = methods.reduce((routeActions, method) => {
        routeActions[method] = (urlParameters, payload) =>
          this._fetchThunk(endpoint, url, urlParameters || {}, method, payload)
        if (method !== 'get') {
          routeActions[`${method}All`] = payload =>
            routeActions[method](void 0, payload)
        }
        return routeActions
      }, {})
      return actions
    }, {})
  }

  _getReducers(routes) {
    return Object.keys(routes).reduce((reducers, endpoint) => {
      reducers[endpoint] = (state = initialEndpointState, action) => {
        switch (action.type) {
          case this.events[endpoint].fetch:
            return {
              ...state,
              loading: true,
              error: null,
            }
          case this.events[endpoint].success:
            return {
              ...state,
              objects: this._mergeObjects(
                action.method,
                state.objects,
                action.objects,
                action.metadata.primary_keys,
                action.urlParameters
              ),
              metadata: action.metadata,
              loading: false,
              error: null,
              lastFetch: action.method === 'get' ? Date.now() : state.lastFetch,
              lastFetchParameters:
                action.method === 'get'
                  ? action.urlParameters
                  : state.lastFetchParameters,
            }
          case this.events[endpoint].error:
            return {
              ...state,
              loading: false,
              error: action.error,
            }
          case this.events[endpoint].cache:
            return {
              ...state,
              loading: false,
            }
          default:
            return state
        }
      }
      return reducers
    }, {})
  }

  _mergeObjects(method, olds, objects, pks, urlParameters) {
    // An equality based on primary keys
    const pkEqual = (o1, o2) => pks.every(pk => o1[pk] === o2[pk])
    // A filter that only returns objects that are not in the given list
    const notIn = objs => obj => !objs.some(o => pkEqual(o, obj))
    switch (method) {
      case 'get':
        // In case of a GET we simply use the new objects
        return [...objects]
      case 'post':
        // In case of a POST we concatenate the new data to the old
        return [...olds, ...objects]
      case 'put':
        // In case of a PUT we replace all if it's a batch
        if (!Object.keys(urlParameters).length) {
          // If there's no path variables it's a batch PUT so
          return [...objects]
        }
      // In case of a PUT one we replace the one that changed
      // Since it's exactly like PATCH we are falling through
      // eslint-disable-next-line no-fallthrough
      case 'patch':
        // In case of a PATCH we replace the element that changed
        // Old objects without the updated new objects + the new objects
        return [...olds.filter(notIn(objects)), ...objects]
      case 'delete':
        // In case of a DELETE we remove all
        return [...olds.filter(notIn(objects))]
    }
  }

  _fetchThunk(endpoint, url, urlParameters, method, payload) {
    return async (dispatch, getState) => {
      dispatch({ type: this.events[endpoint].fetch })
      if (this.cache && method === 'get') {
        const { lastFetch, lastFetchParameters } = getState()[this.prefix][
          endpoint
        ]
        if (
          lastFetch &&
          Date.now() - lastFetch < this.cache &&
          (lastFetchParameters === null ||
            deepEqual(lastFetchParameters, urlParameters))
        ) {
          dispatch({ type: this.events[endpoint].cache })
          return
        }
      }
      try {
        const { objects, ...metadata } = await this._fetchHandler(
          url,
          urlParameters,
          method,
          payload
        )
        dispatch({
          type: this.events[endpoint].success,
          objects,
          metadata,
          method,
          urlParameters,
        })
      } catch (error) {
        dispatch({
          type: this.events[endpoint].error,
          error: error.toString(),
        })
        // If errro handler returns true, the error will propagate
        if (
          this.errorHandler(
            error,
            {
              endpoint,
              url: url(urlParameters),
              urlParameters,
              method,
              payload,
            },
            dispatch,
            getState
          )
        ) {
          throw error
        }
      }
    }
  }

  async _fetchHandler(url, urlParameters, method, payload) {
    const opts = {
      method,
      headers: {
        Accept: 'application/json',
      },
    }
    if (payload) {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(payload)
    }
    const response = await this._fetch(url(urlParameters), opts)
    if (response.status > 300 || response.status < 200) {
      if (response.status === 404 && opts.method === 'get') {
        return { occurences: 0, objects: [] }
      }
      if (response.headers.get('Content-Type') !== 'application/json') {
        const text = await response.text()
        throw httpError(response.status, text)
      }
      const json = await response.json()
      throw httpError(
        response.status,
        json.message || json.description || JSON.stringify(json)
      )
    }
    return response.json()
  }

  _onBeforeFetchHook({ url, opts }) {
    if (this.storage) {
      const jwt = this.storage.getItem('jwt')
      if (jwt) {
        opts.headers.Authorization = `Bearer ${jwt}`
      }
    }
    return { url, opts }
  }

  async _fetch(url, opts) {
    const hookParams = this._onBeforeFetchHook({ url, opts })
    const response = await this.fetch(hookParams.url, hookParams.opts)
    return this._onAfterFetchHook(hookParams, response)
  }

  // eslint-disable-next-line no-unused-vars
  _onAfterFetchHook({ url, opts }, response) {
    if (this.storage) {
      if (response.status === 401) {
        this.storage.removeItem('jwt')
      } else if (response.headers.get('Authorization')) {
        this.storage.setItem('jwt', response.headers.get('Authorization'))
      }
    }
    return response
  }
}
