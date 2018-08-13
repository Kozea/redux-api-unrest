import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

import ApiUnrest, { httpError } from '../src'
import { timeout } from './utils'

describe('Api unrest can handle JWT', () => {
  it('sends the token on fetch request', async () => {
    const storage = {
      getItem: name => storage[name],
      setItem: (name, value) => (storage[name] = value),
      removeItem: name => delete storage[name],
      jwt: 'JWTTOKEN',
    }

    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        JWTStorage: storage,
        apiRoot: state => state,
        fetch: async (url, opts) => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },
            // eslint-disable-next-line require-await
            json: async () => ({
              objects: [{ headers: opts.headers }],
            }),
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )
    await store.dispatch(api.actions.color.get())
    expect(store.getState().color.objects[0].headers.Authorization).toEqual(
      'Bearer JWTTOKEN'
    )
  })
  it('does not send token if there is no token', async () => {
    const storage = {
      getItem: name => storage[name],
      setItem: (name, value) => (storage[name] = value),
      removeItem: name => delete storage[name],
    }

    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        JWTStorage: storage,
        apiRoot: state => state,
        fetch: async (url, opts) => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },
            // eslint-disable-next-line require-await
            json: async () => ({
              objects: [{ headers: opts.headers }],
            }),
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )
    await store.dispatch(api.actions.color.get())
    expect(
      store.getState().color.objects[0].headers.Authorization
    ).toBeUndefined()
  })
  it('sets the token on fetch response', async () => {
    const storage = {
      getItem: name => storage[name],
      setItem: (name, value) => (storage[name] = value),
      removeItem: name => delete storage[name],
      jwt: 'OLDTOKEN',
    }
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        JWTStorage: storage,
        fetch: async () => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                  Authorization: 'JWTTOKEN',
                }[key]),
            },
            // eslint-disable-next-line require-await
            json: async () => ({}),
          }
        },
      }
    )
    await api.actions.color.get()(
      () => ({}),
      () => ({ api: { color: { loading: false } } })
    )
    expect(storage.jwt).toEqual('JWTTOKEN')
  })
  it('removes the token on a 401', async () => {
    const storage = {
      getItem: name => storage[name],
      setItem: (name, value) => (storage[name] = value),
      removeItem: name => delete storage[name],
      jwt: 'shouldBeRemoved',
    }
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        JWTStorage: storage,
        fetch: async () => {
          await timeout(25)
          return {
            status: 401,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                  Authorization: 'BADJWTTOKEN',
                }[key]),
            },
            // eslint-disable-next-line require-await
            json: async () => ({}),
          }
        },
      }
    )
    let catched = true
    try {
      await api.actions.color.get()(
        () => ({}),
        () => ({ api: { color: { loading: false } } })
      )
    } catch (err) {
      catched = true
    }
    expect(catched).toBeTruthy()
    expect(storage.jwt).toBeUndefined()
  })
  it('uses the localStorage if available', () => {
    const api = new ApiUnrest({}, { JWTStorage: true })
    expect(api.storage).toEqual(global.localStorage)
  })
  it('does nothing if the localStorage is unavailable', () => {
    const { localStorage } = global
    delete global.localStorage
    const api = new ApiUnrest({}, { JWTStorage: true })
    expect(api.storage).toBeNull()
    global.localStorage = localStorage
  })
  it('does nothing if the localStorage is broken #1', async () => {
    // Hello safari!
    jest.spyOn(console, 'warn')
    global.console.warn.mockImplementation(() => {})
    const storage = {
      getItem() {
        throw new Error('Bad getItem')
      },
      setItem() {
        throw new Error('Bad setItem')
      },
      removeItem() {
        throw new Error('Bad removeItem')
      },
    }

    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        JWTStorage: storage,
        apiRoot: state => state,
        fetch: async (url, opts) => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                  Authorization: 'foo',
                }[key]),
            },
            json: () => ({
              objects: [{ headers: opts.headers }],
            }),
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )
    await store.dispatch(api.actions.color.get())
    expect(
      store.getState().color.objects[0].headers.Authorization
    ).toBeUndefined()
    expect(storage.jwt).toBeUndefined()
    global.console.warn.mockRestore()
  })
  it('does nothing if the localStorage is broken #2', async () => {
    // Hello safari!
    jest.spyOn(console, 'warn')
    global.console.warn.mockImplementation(() => {})
    const storage = {
      getItem() {
        throw new Error('Bad getItem')
      },
      setItem() {
        throw new Error('Bad setItem')
      },
      removeItem() {
        throw new Error('Bad removeItem')
      },
    }

    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        JWTStorage: storage,
        apiRoot: state => state,
        fetch: async () => {
          await timeout(25)
          return {
            status: 401,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'text/plain',
                  Authorization: 'foo',
                }[key]),
            },
            text: () => 'Fake error',
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )
    const promise = store.dispatch(api.actions.color.get())
    expect(promise).rejects.toEqual(httpError(401, 'Fake error'))
    try {
      await promise
    } catch (e) {
      // Let's await for coverage to take lines in account
    }
    expect(storage.jwt).toBeUndefined()
    global.console.warn.mockRestore()
  })
})
