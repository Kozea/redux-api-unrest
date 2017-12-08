import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

import ApiUnrest from '../src'
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
    await api.actions.color.get()(() => ({}))
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
    try {
      await api.actions.color.get()(() => ({}))
    } catch (err) {
      expect()
    }
    expect(storage.jwt).toBeUndefined()
  })
  it('uses the localStorage if available', () => {
    global.localStorage = { iam: 'localStorage' }
    const api = new ApiUnrest({}, { JWTStorage: true })
    delete global.localStorage
    expect(api.storage).toEqual({ iam: 'localStorage' })
  })
  it('do nothing if the localStorage is unavailable', () => {
    const api = new ApiUnrest({}, { JWTStorage: true })
    expect(api.storage).toBeNull()
  })
})
