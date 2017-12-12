// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

import ApiUnrest from '../src'
import { timeout } from './utils'

describe('Actions of api-unrest', () => {
  const fakeGetState = () => ({
    api: {
      color: { loading: false },
      tree: { loading: false },
      pine: { loading: false },
    },
  })
  describe('is exhaustive', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    ;[('fruit', 'color', 'tree')].map(endpoint =>
      it(`generates all for ${endpoint}`, () => {
        ;['', 'All'].map(suffix =>
          ['get', 'post', 'put', 'patch', 'delete'].map(method =>
            expect(Object.keys(api.actions[endpoint])).toContain(
              method + suffix
            )
          )
        )
      })
    )
  })
  it('generates a promise', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      { rootPath: 'http://kozea.fr/api' } // This does not exists
    )
    const actionHistory = []
    const fakeDispatch = action => actionHistory.push(action)
    const dispatched = api.actions.color.get()(fakeDispatch, fakeGetState)
    expect(dispatched.constructor.name).toEqual('Promise')
    dispatched.catch(() => ({}))
    expect(actionHistory[0].type).toEqual(api.events.color.fetch)
  })
  describe('with fetch', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        fetch: async (url, opts) => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key => ({ 'Content-Type': 'application/json' }[key]),
            },
            // eslint-disable-next-line require-await
            json: async () => ({
              objects: [{ url, ...opts }],
              primary_keys: ['key'],
            }),
          }
        },
      }
    )

    it('calls fetch with the right method and params', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch, fakeGetState)
          : actionHistory.push(action)
      const hasSucceded = await fakeDispatch(api.actions.color.get())
      expect(hasSucceded).toBeTruthy()
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.success)
      expect(actionHistory[1].method).toEqual('get')
      expect(actionHistory[1].metadata.primary_keys[0]).toEqual('key')
      expect(actionHistory[1].objects[0].method).toEqual('get')
      expect(actionHistory[1].objects[0].url).toEqual('/base/color')
      expect(actionHistory[1].objects[0].headers.Accept).toEqual(
        'application/json'
      )
      expect(actionHistory[1].parameters).toEqual({})
    })

    it('calls fetch with query string when payload and get', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch, fakeGetState)
          : actionHistory.push(action)
      const hasSucceded = await fakeDispatch(
        api.actions.color.getAll({ offset: 0, limit: 50 })
      )
      expect(hasSucceded).toBeTruthy()
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.success)
      expect(actionHistory[1].method).toEqual('get')
      expect(actionHistory[1].metadata.primary_keys[0]).toEqual('key')
      expect(actionHistory[1].objects[0].method).toEqual('get')
      expect(actionHistory[1].objects[0].url).toEqual(
        '/base/color?limit=50&offset=0'
      )
      expect(actionHistory[1].batch).toBeTruthy()
      expect(actionHistory[1].objects[0].headers.Accept).toEqual(
        'application/json'
      )
      expect(actionHistory[1].parameters).toEqual({ offset: 0, limit: 50 })
    })

    it('calls fetch with query string and parameters', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch, fakeGetState)
          : actionHistory.push(action)
      const hasSucceded = await fakeDispatch(
        api.actions.color.get({ id: 5 }, { offset: 0, limit: 50 })
      )
      expect(hasSucceded).toBeTruthy()
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.success)
      expect(actionHistory[1].method).toEqual('get')
      expect(actionHistory[1].metadata.primary_keys[0]).toEqual('key')
      expect(actionHistory[1].objects[0].method).toEqual('get')
      expect(actionHistory[1].objects[0].url).toEqual(
        '/base/color/5?limit=50&offset=0'
      )
      expect(actionHistory[1].objects[0].headers.Accept).toEqual(
        'application/json'
      )
      expect(actionHistory[1].batch).toBeFalsy()
      expect(actionHistory[1].parameters).toEqual({
        id: 5,
        offset: 0,
        limit: 50,
      })
    })
    ;['post', 'put', 'patch', 'delete'].map(method =>
      it(`calls fetch for ${method} with the right params / body`, async () => {
        const actionHistory = []
        const fakeDispatch = action =>
          typeof action === 'function'
            ? action(fakeDispatch, fakeGetState)
            : actionHistory.push(action)
        await fakeDispatch(
          api.actions.tree[method]({ type: 'pine', age: 42 }, { object: 2 })
        )
        expect(actionHistory[0]).toEqual({ type: api.events.tree.fetch })
        expect(actionHistory[1].type).toEqual(api.events.tree.success)
        expect(actionHistory[1].method).toEqual(method)
        expect(actionHistory[1].metadata.primary_keys[0]).toEqual('key')
        expect(actionHistory[1].objects[0].method).toEqual(method)
        expect(actionHistory[1].objects[0].body).toEqual('{"object":2}')
        expect(actionHistory[1].objects[0].url).toEqual('/forest/tree/pine/42')
        expect(actionHistory[1].objects[0].headers.Accept).toEqual(
          'application/json'
        )
        expect(actionHistory[1].parameters).toEqual({
          type: 'pine',
          age: 42,
        })
      })
    )
    ;['post', 'put', 'patch', 'delete'].map(method =>
      it(`calls fetch for ${method} with the right params / body`, async () => {
        const actionHistory = []
        const fakeDispatch = action =>
          typeof action === 'function'
            ? action(fakeDispatch, fakeGetState)
            : actionHistory.push(action)
        await fakeDispatch(api.actions.tree[`${method}All`]({ object: 2 }))
        expect(actionHistory[0]).toEqual({ type: api.events.tree.fetch })
        expect(actionHistory[1].type).toEqual(api.events.tree.success)
        expect(actionHistory[1].method).toEqual(method)
        expect(actionHistory[1].metadata.primary_keys[0]).toEqual('key')
        expect(actionHistory[1].objects[0].method).toEqual(method)
        expect(actionHistory[1].objects[0].body).toEqual('{"object":2}')
        expect(actionHistory[1].objects[0].url).toEqual('/forest/tree')
        expect(actionHistory[1].objects[0].headers.Accept).toEqual(
          'application/json'
        )
        expect(actionHistory[1].parameters).toEqual({})
      })
    )
  })
  describe('Handles http errors with json', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        fetch: async () => {
          await timeout(25)
          return {
            status: 500,
            headers: {
              get: key => ({ 'Content-Type': 'application/json' }[key]),
            },
            // eslint-disable-next-line require-await
            json: async () => ({
              message: 'This is the error',
            }),
          }
        },
      }
    )
    it('returns the error', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch, fakeGetState)
          : actionHistory.push(action)
      try {
        await fakeDispatch(api.actions.color.get())
      } catch (err) {
        expect(err.toString()).toEqual('HttpError: [500] - This is the error')
      }
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.error)
      expect(actionHistory[1].error).toEqual(
        'HttpError: [500] - This is the error'
      )
    })
  })
  describe('Handles http errors with text', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        fetch: async () => {
          await timeout(25)
          return {
            status: 500,
            headers: {
              get: key => ({ 'Content-Type': 'text/plain' }[key]),
            },
            // eslint-disable-next-line require-await
            text: async () => 'This is the text error',
          }
        },
      }
    )
    it('returns the error', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch, fakeGetState)
          : actionHistory.push(action)
      try {
        await fakeDispatch(api.actions.color.get())
      } catch (err) {
        expect(err.toString()).toEqual(
          'HttpError: [500] - This is the text error'
        )
      }
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.error)
      expect(actionHistory[1].error).toEqual(
        'HttpError: [500] - This is the text error'
      )
    })
  })
  describe('Handles 404', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        fetch: async () => {
          await timeout(25)
          return {
            status: 404,
            headers: {
              get: key => ({ 'Content-Type': 'application/json' }[key]),
            },
            // eslint-disable-next-line require-await
            json: async () => ({
              message: 'whatever',
            }),
          }
        },
      }
    )
    it('does raise like an error', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch, fakeGetState)
          : actionHistory.push(action)
      try {
        await fakeDispatch(api.actions.color.get())
      } catch (err) {
        expect(err.toString()).toEqual('HttpError: [404] - whatever')
      }
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.error)
      expect(actionHistory[1].error).toEqual('HttpError: [404] - whatever')
    })
  })
  describe('Handles 404 as no occurrence if it is an empty response', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        fetch: async () => {
          await timeout(25)
          return {
            status: 404,
            headers: {
              get: key => ({ 'Content-Type': 'application/json' }[key]),
            },
            // eslint-disable-next-line require-await
            json: async () => ({
              occurences: 0,
              objects: [],
            }),
          }
        },
      }
    )
    it('does not raise and returns 0 occurence', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch, fakeGetState)
          : actionHistory.push(action)
      await fakeDispatch(api.actions.color.get())
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.success)
      expect(actionHistory[1].objects).toEqual([])
      expect(actionHistory[1].metadata.occurences).toEqual(0)
    })
  })
  describe('Error handler', () => {
    it('respects the return value', async () => {
      const api = new ApiUnrest(
        {
          fruit: 'fruit',
          color: 'base/color/:id?',
          tree: 'forest/tree/:type?/:age?',
        },
        {
          fetch: async () => {
            await timeout(25)
            return {
              status: 500,
              headers: {
                get: key => ({ 'Content-Type': 'text/plain' }[key]),
              },
              // eslint-disable-next-line require-await
              text: async () => 'This is the text error',
            }
          },
          errorHandler: () => false,
        }
      )
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch, fakeGetState)
          : actionHistory.push(action)

      const hasSucceded = await fakeDispatch(api.actions.color.get())
      expect(hasSucceded).toBeFalsy()
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.error)
      expect(actionHistory[1].error).toEqual(
        'HttpError: [500] - This is the text error'
      )
    })

    it('sets the correct parameters', async () => {
      const dispatchMarker = () => ({})
      const getStateMarker = () => fakeGetState()
      const api = new ApiUnrest(
        {
          fruit: 'fruit',
          color: 'base/color/:id?',
          tree: 'forest/tree/:type?/:age?',
        },
        {
          fetch: async () => {
            await timeout(25)
            return {
              status: 500,
              headers: {
                get: key => ({ 'Content-Type': 'text/plain' }[key]),
              },
              // eslint-disable-next-line require-await
              text: async () => 'This is the text error',
            }
          },
          errorHandler: (
            error,
            { endpoint, url, urlParameters, method, payload },
            dispatch,
            getState
          ) => {
            expect(error.name).toEqual('HttpError')
            expect(error.code).toEqual(500)
            expect(endpoint).toEqual('color')
            expect(url).toEqual('/base/color')
            expect(urlParameters).toEqual({})
            expect(method).toEqual('get')
            expect(payload).toEqual({})
            expect(dispatch).toEqual(dispatchMarker)
            expect(getState).toEqual(getStateMarker)
            return false
          },
        }
      )
      await api.actions.color.get()(dispatchMarker, getStateMarker)
    })
  })
})
