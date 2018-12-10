import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'

import ApiUnrest from '../src'
import { timeout } from './utils'

describe('Api unrest update the state when fetching', () => {
  it('sets and remove loading flag during success', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
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
              objects: ['response'],
            }),
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )

    expect(store.getState().color.loading).toBeFalsy()
    const fetchPromise = store.dispatch(api.actions.color.get())
    expect(store.getState().color.loading).toBeTruthy()
    await fetchPromise
    expect(store.getState().color.loading).toBeFalsy()
    expect(store.getState().color.objects).toEqual(['response'])
    expect(store.getState().color.error).toBeNull()
    expect(store.getState().color.metadata.code).toEqual(200)
  })
  it('sets and remove loading flag during error', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        apiRoot: state => state,
        fetch: async () => {
          await timeout(25)
          return {
            status: 500,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'application/json',
                }[key]),
            },

            json: () => ({
              message: 'error',
            }),
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )

    expect(store.getState().color.loading).toBeFalsy()
    const fetchPromise = store.dispatch(api.actions.color.get())
    expect(store.getState().color.loading).toBeTruthy()
    let catched = false
    try {
      await fetchPromise
    } catch (err) {
      expect(err).toBeTruthy()
      catched = true
    }
    expect(catched).toBeTruthy()
    expect(store.getState().color.loading).toBeFalsy()
    expect(store.getState().color.error).toEqual('HttpError: [500] - error')
  })
  it('throws an error on concurrent requests', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
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
              objects: ['data'],
            }),
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )
    let catched = false
    try {
      await Promise.all([
        store.dispatch(api.actions.color.get()),
        store.dispatch(api.actions.color.get()),
      ])
    } catch (err) {
      catched = true
      expect(err.name).toEqual('AlreadyLoadingError')
    }
    expect(catched).toBeTruthy()
  })
  it('still success on first request on concurrent requests', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        apiRoot: state => state,
        errorHandler: () => false,
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
              objects: ['data'],
            }),
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )
    await Promise.all([
      store.dispatch(api.actions.color.get()),
      store.dispatch(api.actions.color.get()),
    ])
    expect(store.getState().color.objects).toEqual(['data'])
  })

  it('can force its way on concurrent requests', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        apiRoot: state => state,
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
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )
    const reports = await Promise.all([
      store.dispatch(api.actions.color.getItem({ id: 1 })),
      store.dispatch(api.actions.color.force.getItem({ id: 2 })),
    ])

    expect(reports[0].status).toEqual('aborted')
    expect(reports[1].status).toEqual('success')
    expect(store.getState().color.objects).toEqual(['/base/color/2'])
  })

  it('can force its way on concurrent requests without arguments', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        apiRoot: state => state,
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
      combineReducers(api.reducers),
      applyMiddleware(thunk, logMiddleware)
    )
    const reports = await Promise.all([
      store.dispatch(api.actions.color.get()),
      store.dispatch(api.actions.color.force.get()),
    ])

    expect(reports[0].status).toEqual('aborted')
    expect(reports[1].status).toEqual('success')
    expect(actionLog[0].type).toEqual(api.events.color.fetch)

    expect(actionLog[1].type).toEqual(api.events.color.fetch)
    expect(actionLog[2].type).toEqual(api.events.color.abort)
    expect(actionLog[3].type).toEqual(api.events.color.success)
  })

  it('can force its way on concurrent requests even with cache', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        apiRoot: state => state,
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
      combineReducers(api.reducers),
      applyMiddleware(thunk, logMiddleware)
    )
    await store.dispatch(api.actions.color.get())
    const reports = await Promise.all([
      store.dispatch(api.actions.color.getItem({ id: 2 })),
      store.dispatch(api.actions.color.force.get()),
    ])

    expect(reports[0].status).toEqual('aborted')
    expect(reports[1].status).toEqual('success')

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.success)

    expect(actionLog[2].type).toEqual(api.events.color.fetch)

    expect(actionLog[3].type).toEqual(api.events.color.fetch)
    expect(actionLog[4].type).toEqual(api.events.color.abort)
    expect(actionLog[5].type).toEqual(api.events.color.success)
  })

  it('can force its way on concurrent requests on other method', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        apiRoot: state => state,
        fetch: async (url, { body }) => {
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
              objects: body ? [JSON.parse(body)] : [],
            }),
          }
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )

    const reports = await Promise.all([
      store.dispatch(api.actions.color.post({ o: 1 })),
      store.dispatch(api.actions.color.force.post()),
      store.dispatch(api.actions.color.force.post({ o: 2 })),
    ])

    expect(reports[0].status).toEqual('aborted')
    expect(reports[1].status).toEqual('aborted')
    expect(reports[2].status).toEqual('success')
    expect(store.getState().color.objects).toEqual([{ o: 2 }])
    // What happened to the object 1 -> we can't say so don't use that!
    expect(api.fetches.color).toBeUndefined()
  })

  it('resets while a request is pending', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        apiRoot: state => state,
        fetch: async () => {
          await timeout(25)
          throw new Error('We should never go here')
        },
      }
    )
    const store = createStore(
      combineReducers(api.reducers),
      applyMiddleware(thunk)
    )

    expect(store.getState().color.loading).toBeFalsy()
    const fetchPromise = store.dispatch(api.actions.color.get())
    expect(api.fetches.color).not.toBeUndefined()
    expect(store.getState().color.loading).toBeTruthy()
    setTimeout(() => {
      expect(store.getState().color.loading).toBeTruthy()
      store.dispatch(api.actions.color.reset())
      expect(store.getState().color.loading).toBeFalsy()
    }, 1)

    const report = await fetchPromise

    expect(report.status).toEqual('aborted')
    expect(store.getState().color.objects).toEqual([])
    expect(api.fetches.color).toBeUndefined()
  })
  it('aborts several requests in a row', async () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:type?/:age?',
      },
      {
        cache: 100,
        apiRoot: state => state,
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
      combineReducers(api.reducers),
      applyMiddleware(thunk, logMiddleware)
    )
    const reports = await Promise.all([
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
      store.dispatch(api.actions.color.force.get()),
    ])

    expect(reports[0].status).toEqual('aborted')
    expect(reports[1].status).toEqual('aborted')
    expect(reports[2].status).toEqual('aborted')
    expect(reports[3].status).toEqual('aborted')
    expect(reports[4].status).toEqual('aborted')
    expect(reports[5].status).toEqual('aborted')
    expect(reports[6].status).toEqual('aborted')
    expect(reports[7].status).toEqual('aborted')
    expect(reports[8].status).toEqual('aborted')
    expect(reports[9].status).toEqual('aborted')
    expect(reports[10].status).toEqual('success')

    expect(actionLog[0].type).toEqual(api.events.color.fetch)
    expect(actionLog[1].type).toEqual(api.events.color.fetch)
    expect(actionLog[2].type).toEqual(api.events.color.fetch)
    expect(actionLog[3].type).toEqual(api.events.color.fetch)
    expect(actionLog[4].type).toEqual(api.events.color.fetch)
    expect(actionLog[5].type).toEqual(api.events.color.fetch)
    expect(actionLog[6].type).toEqual(api.events.color.fetch)
    expect(actionLog[7].type).toEqual(api.events.color.fetch)
    expect(actionLog[8].type).toEqual(api.events.color.fetch)
    expect(actionLog[9].type).toEqual(api.events.color.fetch)
    expect(actionLog[10].type).toEqual(api.events.color.fetch)
    expect(actionLog[11].type).toEqual(api.events.color.abort)
    expect(actionLog[12].type).toEqual(api.events.color.abort)
    expect(actionLog[13].type).toEqual(api.events.color.abort)
    expect(actionLog[14].type).toEqual(api.events.color.abort)
    expect(actionLog[15].type).toEqual(api.events.color.abort)
    expect(actionLog[16].type).toEqual(api.events.color.abort)
    expect(actionLog[17].type).toEqual(api.events.color.abort)
    expect(actionLog[18].type).toEqual(api.events.color.abort)
    expect(actionLog[19].type).toEqual(api.events.color.abort)
    expect(actionLog[20].type).toEqual(api.events.color.abort)
    expect(actionLog[21].type).toEqual(api.events.color.success)
  })
})
