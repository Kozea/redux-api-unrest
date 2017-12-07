import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'

import ApiUnrest from '../src'

describe('Api unrest reducers', () => {
  it('generates all the reducers', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    expect(Object.keys(api.reducers)).toEqual(['fruit', 'color', 'tree'])
    expect(typeof api.reducers.color).toEqual('function')
  })

  it('sets correctly the initial state', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers({
      reducer1: (state = 1) => state,
      api: combineReducers(api.reducers),
      reducer2: (state = 2) => state,
    })
    const store = createStore(reducer, applyMiddleware(thunk))
    expect(Object.keys(store.getState())).toEqual([
      'reducer1',
      'api',
      'reducer2',
    ])
    ;['fruit', 'color', 'tree'].map(endpoint =>
      expect(store.getState().api[endpoint]).toEqual({
        objects: [],
        error: null,
        lastFetch: null,
        lastFetchParams: null,
        loading: false,
        metadata: {},
      })
    )
  })

  it('reduces correctly items', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(reducer, applyMiddleware(thunk))
    expect(Object.keys(store.getState())).toEqual(['fruit', 'color', 'tree'])
    expect(store.getState().fruit).toEqual({
      objects: [],
      error: null,
      lastFetch: null,
      lastFetchParams: null,
      loading: false,
      metadata: {},
    })
    store.dispatch({
      type: api.events.fruit.success,
      objects: [{ o: 1 }, { o: 2 }],
      metadata: { occurences: 2, primary_keys: ['o'] },
      method: 'get',
      urlParameters: {},
    })
    expect(Object.keys(store.getState().fruit)).toEqual([
      'objects',
      'metadata',
      'loading',
      'error',
      'lastFetch',
      'lastFetchParams',
    ])
    expect(store.getState().fruit.objects).toEqual([{ o: 1 }, { o: 2 }])
    expect(store.getState().fruit.error).toBeNull()
    expect(store.getState().fruit.lastFetch).not.toBeNull()
    expect(store.getState().fruit.lastFetchParams).toEqual({})
    expect(store.getState().fruit.loading).toEqual(false)
    expect(store.getState().fruit.metadata.occurences).toEqual(2)
    expect(store.getState().fruit.metadata.primary_keys).toEqual(['o'])
  })
})
