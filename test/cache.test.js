import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

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
            // eslint-disable-next-line require-await
            json: async () => ({
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
            // eslint-disable-next-line require-await
            json: async () => ({
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
            // eslint-disable-next-line require-await
            json: async () => ({
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
    await timeout(120)

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
})
