import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'

import ApiUnrest from '../src'
import { timeout } from './utils'

describe('Api unrest provides a cache', () => {
  it('does not use it if not activated', async () => {
    let i = 0
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
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              objects: [i++],
            }),
          }
        },
      }
    )
    const actionLog = []
    const logMiddleware = () => next => action => {
      actionLog.push(action)
      return next(action)
    }
    const store = createStore(
      combineReducers({ api: combineReducers(api.reducers) }),
      applyMiddleware(thunk, logMiddleware)
    )

    const firstFetch = store.dispatch(api.actions.color.get())
    expect(store.getState().api.color.loading).toBeTruthy()
    await firstFetch
    expect(store.getState().api.color.loading).toBeFalsy()
    expect(store.getState().api.color.objects[0]).toEqual(0)

    const secondFetch = store.dispatch(api.actions.color.get())
    expect(store.getState().api.color.loading).toBeTruthy()
    await secondFetch
    expect(store.getState().api.color.loading).toBeFalsy()
    expect(store.getState().api.color.objects[0]).toEqual(1)

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.success)
  })
  it('does use it if activated', async () => {
    let i = 0
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        fetch: async () => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              objects: [i++],
            }),
          }
        },
      }
    )
    const actionLog = []
    const logMiddleware = () => next => action => {
      actionLog.push(action)
      return next(action)
    }
    const store = createStore(
      combineReducers({ api: combineReducers(api.reducers) }),
      applyMiddleware(thunk, logMiddleware)
    )

    const firstFetch = store.dispatch(api.actions.color.get())
    expect(store.getState().api.color.loading).toBeTruthy()
    await firstFetch
    expect(store.getState().api.color.loading).toBeFalsy()
    expect(store.getState().api.color.objects[0]).toEqual(0)

    const secondFetch = store.dispatch(api.actions.color.get())
    expect(store.getState().api.color.loading).toBeFalsy()
    await secondFetch
    expect(store.getState().api.color.loading).toBeFalsy()
    expect(store.getState().api.color.objects[0]).toEqual(0)

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.cache)
  })

  it('respects the apiRoot option', async () => {
    let i = 0
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        apiRoot: state => state,
        fetch: async () => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              objects: [i++],
            }),
          }
        },
      }
    )
    const actionLog = []
    const logMiddleware = () => next => action => {
      actionLog.push(action)
      return next(action)
    }
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk, logMiddleware)
    )

    const firstFetch = store.dispatch(api.actions.color.get())
    expect(store.getState().color.loading).toBeTruthy()
    await firstFetch
    expect(store.getState().color.loading).toBeFalsy()
    expect(store.getState().color.objects[0]).toEqual(0)

    const secondFetch = store.dispatch(api.actions.color.get())
    expect(store.getState().color.loading).toBeFalsy()
    await secondFetch
    expect(store.getState().color.loading).toBeFalsy()
    expect(store.getState().color.objects[0]).toEqual(0)

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.cache)
  })

  it('does respect the timeout', async () => {
    let i = 0
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        fetch: async () => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              objects: [i++],
            }),
          }
        },
      }
    )
    const actionLog = []
    const logMiddleware = () => next => action => {
      actionLog.push(action)
      return next(action)
    }
    const store = createStore(
      combineReducers({ api: combineReducers(api.reducers) }),
      applyMiddleware(thunk, logMiddleware)
    )

    await store.dispatch(api.actions.color.get())
    expect(store.getState().api.color.objects[0]).toEqual(0)

    await timeout(120)

    await store.dispatch(api.actions.color.get())
    expect(store.getState().api.color.objects[0]).toEqual(1)

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.success)
  })
  ;[('put', 'post', 'patch', 'delete')].map(method => {
    it(`does not cache ${method} method`, async () => {
      let i = 0
      const api = new ApiUnrest(
        {
          fruit: 'fruit',
          color: 'base/color/:id?',
          tree: 'forest/tree/:type?/:age?',
        },
        {
          cache: 1000,
          fetch: async () => {
            await timeout(25)
            return {
              status: 200,
              headers: {
                get: key =>
                  ({
                    'Content-Type': 'application/json',
                  }[key]),
              },

              json: () => ({
                objects: [i++],
              }),
            }
          },
        }
      )
      const actionLog = []
      const logMiddleware = () => next => action => {
        actionLog.push(action)
        return next(action)
      }
      const store = createStore(
        combineReducers({ api: combineReducers(api.reducers) }),
        applyMiddleware(thunk, logMiddleware)
      )

      await store.dispatch(api.actions.color[method]())
      await store.dispatch(api.actions.color[method]())
      expect(actionLog[0].type).toEqual(api.events.color.fetch)
      expect(actionLog[1].type).toEqual(api.events.color.success)
      expect(actionLog[2].type).toEqual(api.events.color.fetch)
      expect(actionLog[3].type).toEqual(api.events.color.success)
    })
  })

  it('does not cache two different parameters', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        fetch: async url => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              objects: [url],
            }),
          }
        },
      }
    )
    const actionLog = []
    const logMiddleware = () => next => action => {
      actionLog.push(action)
      return next(action)
    }
    const store = createStore(
      combineReducers({ api: combineReducers(api.reducers) }),
      applyMiddleware(thunk, logMiddleware)
    )

    await store.dispatch(api.actions.color.getItem({ id: 3 }))
    expect(store.getState().api.color.objects[0]).toEqual('/base/color/3')

    await store.dispatch(api.actions.color.getItem({ id: 4 }))
    expect(store.getState().api.color.objects[0]).toEqual('/base/color/4')

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.success)
  })

  it('does cache two equal parameters', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        fetch: async url => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              objects: [url],
            }),
          }
        },
      }
    )
    const actionLog = []
    const logMiddleware = () => next => action => {
      actionLog.push(action)
      return next(action)
    }
    const store = createStore(
      combineReducers({ api: combineReducers(api.reducers) }),
      applyMiddleware(thunk, logMiddleware)
    )

    await store.dispatch(api.actions.color.getItem({ id: 3 }))
    expect(store.getState().api.color.objects[0]).toEqual('/base/color/3')

    await store.dispatch(api.actions.color.getItem({ id: 3 }))
    expect(store.getState().api.color.objects[0]).toEqual('/base/color/3')

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.cache)
  })

  it('does not cache two equal parameters with different query', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        fetch: async url => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              objects: [url],
            }),
          }
        },
      }
    )
    const actionLog = []
    const logMiddleware = () => next => action => {
      actionLog.push(action)
      return next(action)
    }
    const store = createStore(
      combineReducers({ api: combineReducers(api.reducers) }),
      applyMiddleware(thunk, logMiddleware)
    )

    await store.dispatch(api.actions.color.getItem({ id: 3 }, { offset: 0 }))
    expect(store.getState().api.color.objects[0]).toEqual(
      '/base/color/3?offset=0'
    )

    await store.dispatch(api.actions.color.getItem({ id: 3 }, { offset: 10 }))
    expect(store.getState().api.color.objects[0]).toEqual(
      '/base/color/3?offset=10'
    )

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.success)
  })

  it('does cache two equal parameters with equal query', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        fetch: async url => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              objects: [url],
            }),
          }
        },
      }
    )
    const actionLog = []
    const logMiddleware = () => next => action => {
      actionLog.push(action)
      return next(action)
    }
    const store = createStore(
      combineReducers({ api: combineReducers(api.reducers) }),
      applyMiddleware(thunk, logMiddleware)
    )

    await store.dispatch(api.actions.color.getItem({ id: 3 }, { offset: 0 }))
    expect(store.getState().api.color.objects[0]).toEqual(
      '/base/color/3?offset=0'
    )

    await store.dispatch(api.actions.color.getItem({ id: 3 }, { offset: 0 }))
    expect(store.getState().api.color.objects[0]).toEqual(
      '/base/color/3?offset=0'
    )

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.cache)
  })
})
