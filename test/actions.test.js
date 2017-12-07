// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

import ApiUnrest from '../src'
import { timeout } from './utils'

describe('Actions api generation', () => {
  describe('is exhaustive', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:size?/:age?',
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
        tree: 'forest/tree/:size?/:age?',
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
  describe('actions with fetch', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:size?/:age?',
      },
      {
        fetch: async (url, opts) => {
          await timeout(25)
          return {
            status: 200,
            // eslint-disable-next-line require-await
            json: async () => ({
              objects: [{ url, ...opts }],
              primary_keys: ['key'],
            }),
          }
        },
      }
    )

    it('calls fetch with the right method', async () => {
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
      expect(actionHistory[1].urlParameters).toBeUndefined()
    })
  })
})
