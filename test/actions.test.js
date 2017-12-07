// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

import ApiUnrest from '../src'
import { timeout } from './utils'

describe('Actions of api-unrest', () => {
  describe('is exhaustive', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    ;[('fruit', 'color', 'tree')].map(endpoint =>
      it(`generates all for ${endpoint}`, () => {
        ;[
          'get',
          'post',
          'put',
          'patch',
          'delete',
          'postAll',
          'putAll',
          'patchAll',
          'deleteAll',
        ].map(method =>
          expect(Object.keys(api.actions[endpoint])).toContain(method)
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
    const fakeDispatch = action =>
      typeof action === 'function'
        ? action(fakeDispatch)
        : actionHistory.push(action)
    const dispatched = api.actions.color.get()(fakeDispatch)
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
          ? action(fakeDispatch)
          : actionHistory.push(action)
      await fakeDispatch(api.actions.color.get())
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.success)
      expect(actionHistory[1].method).toEqual('get')
      expect(actionHistory[1].metadata.primary_keys[0]).toEqual('key')
      expect(actionHistory[1].objects[0].method).toEqual('get')
      expect(actionHistory[1].objects[0].url).toEqual('/base/color')
      expect(actionHistory[1].objects[0].headers.Accept).toEqual(
        'application/json'
      )
      expect(actionHistory[1].urlParameters).toEqual({})
    })

    it('calls fetch with the right method and params with params', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch)
          : actionHistory.push(action)
      await fakeDispatch(api.actions.color.get({ id: 4 }, { newObject: true }))
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.success)
      expect(actionHistory[1].method).toEqual('get')
      expect(actionHistory[1].metadata.primary_keys[0]).toEqual('key')
      expect(actionHistory[1].objects[0].method).toEqual('get')
      expect(actionHistory[1].objects[0].url).toEqual('/base/color/4')
      expect(actionHistory[1].objects[0].headers.Accept).toEqual(
        'application/json'
      )
      expect(actionHistory[1].urlParameters).toEqual({ id: 4 })
    })
    ;['post', 'put', 'patch', 'delete'].map(method =>
      it(`calls fetch for ${method} with the right params / body`, async () => {
        const actionHistory = []
        const fakeDispatch = action =>
          typeof action === 'function'
            ? action(fakeDispatch)
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
        expect(actionHistory[1].urlParameters).toEqual({
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
            ? action(fakeDispatch)
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
        expect(actionHistory[1].urlParameters).toEqual({})
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
          ? action(fakeDispatch)
          : actionHistory.push(action)
      try {
        await fakeDispatch(api.actions.color.get())
      } catch (err) {
        expect(err.toString()).toEqual('Error: [500] - This is the error')
      }
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.error)
      expect(actionHistory[1].error).toEqual('Error: [500] - This is the error')
    })
  })
  describe('Handles 404 as no occurrence', () => {
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
            json: async () => ({}),
          }
        },
      }
    )
    it('does not crash and returns 0 occurence', async () => {
      const actionHistory = []
      const fakeDispatch = action =>
        typeof action === 'function'
          ? action(fakeDispatch)
          : actionHistory.push(action)
      await fakeDispatch(api.actions.color.get())
      expect(actionHistory[0]).toEqual({ type: api.events.color.fetch })
      expect(actionHistory[1].type).toEqual(api.events.color.success)
      expect(actionHistory[1].objects).toEqual([])
      expect(actionHistory[1].metadata.occurences).toEqual(0)
    })
  })
})
