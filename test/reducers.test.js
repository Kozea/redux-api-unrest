import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'

import ApiUnrest from '../src'

const init = (objects = []) => ({
  objects,
  metadata: {
    occurences: objects.length,
    primary_keys: ['id'],
  },
  loading: false,
  error: null,
  lastFetch: null,
  lastFetchParameters: null,
})

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
        lastFetchParameters: null,
        loading: false,
        metadata: {},
      })
    )
  })

  it('initializes correctly the store', () => {
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
      lastFetchParameters: null,
      loading: false,
      metadata: {},
    })
  })

  it('fills correctly the store on get', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch({
      type: api.events.color.success,
      objects: [{ id: 1, name: 'orange' }, { id: 2, name: 'yellow' }],
      metadata: { occurences: 2, primary_keys: ['id'] },
      method: 'GET',
      parameters: {},
      batch: true,
    })
    expect(Object.keys(store.getState().color)).toEqual([
      'objects',
      'metadata',
      'loading',
      'error',
      'lastFetch',
      'lastFetchParameters',
    ])
    expect(store.getState().color.objects).toEqual([
      { id: 1, name: 'orange' },
      { id: 2, name: 'yellow' },
    ])
    expect(store.getState().color.error).toBeNull()
    expect(store.getState().color.lastFetch).not.toBeNull()
    expect(store.getState().color.lastFetchParameters).toEqual({})
    expect(store.getState().color.loading).toEqual(false)
    expect(store.getState().color.metadata.occurences).toEqual(2)
    expect(store.getState().color.metadata.primary_keys).toEqual(['id'])
  })

  it('resets correctly the store', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch({
      type: api.events.color.success,
      objects: [{ id: 1, name: 'orange' }, { id: 2, name: 'yellow' }],
      metadata: { occurences: 2, primary_keys: ['id'] },
      method: 'GET',
      parameters: {},
      batch: true,
    })
    expect(store.getState().color.objects).toEqual([
      { id: 1, name: 'orange' },
      { id: 2, name: 'yellow' },
    ])
    expect(store.getState().color.error).toBeNull()
    expect(store.getState().color.lastFetch).not.toBeNull()
    expect(store.getState().color.lastFetchParameters).toEqual({})
    expect(store.getState().color.loading).toEqual(false)
    expect(store.getState().color.metadata.occurences).toEqual(2)
    expect(store.getState().color.metadata.primary_keys).toEqual(['id'])
    store.dispatch(api.actions.color.reset())
    expect(store.getState().color).toEqual({
      objects: [],
      error: null,
      lastFetch: null,
      lastFetchParameters: null,
      loading: false,
      metadata: {},
    })
  })

  it('fills correctly the store on another get', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([{ id: 1, name: 'orange' }, { id: 2, name: 'yellow' }]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.color.success,
      objects: [{ id: 4, name: 'blue' }, { id: 2, name: 'green' }],
      metadata: { occurences: 2, primary_keys: ['id'] },
      method: 'GET',
      parameters: {},
      batch: true,
    })
    expect(Object.keys(store.getState().color)).toEqual([
      'objects',
      'metadata',
      'loading',
      'error',
      'lastFetch',
      'lastFetchParameters',
    ])
    expect(store.getState().color.objects).toEqual([
      { id: 4, name: 'blue' },
      { id: 2, name: 'green' },
    ])
    expect(store.getState().color.error).toBeNull()
    expect(store.getState().color.lastFetch).not.toBeNull()
    expect(store.getState().color.lastFetchParameters).toEqual({})
    expect(store.getState().color.loading).toEqual(false)
    expect(store.getState().color.metadata.occurences).toEqual(2)
    expect(store.getState().color.metadata.primary_keys).toEqual(['id'])
  })

  it('fills correctly the store on a get with id', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([{ id: 1, name: 'orange' }, { id: 2, name: 'yellow' }]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.color.success,
      objects: [{ id: 4, name: 'blue' }],
      metadata: { occurences: 1, primary_keys: ['id'] },
      method: 'GET',
      parameters: { id: 4 },
      batch: false,
    })
    expect(Object.keys(store.getState().color)).toEqual([
      'objects',
      'metadata',
      'loading',
      'error',
      'lastFetch',
      'lastFetchParameters',
    ])
    expect(store.getState().color.objects).toEqual([{ id: 4, name: 'blue' }])
    expect(store.getState().color.error).toBeNull()
    expect(store.getState().color.lastFetch).not.toBeNull()
    expect(store.getState().color.lastFetchParameters).toEqual({ id: 4 })
    expect(store.getState().color.loading).toEqual(false)
    expect(store.getState().color.metadata.occurences).toEqual(1)
    expect(store.getState().color.metadata.primary_keys).toEqual(['id'])
  })

  it('fill correctly the store on post with id', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([{ id: 4, name: 'blue' }, { id: 2, name: 'green' }]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.fruit.success,
      objects: [{ id: 5, name: 'pink' }],
      metadata: { occurences: 1, primary_keys: ['id'] },
      method: 'POST',
      parameters: { id: 5 },
      batch: false,
    })
    expect(store.getState().fruit.objects).toEqual([
      { id: 4, name: 'blue' },
      { id: 2, name: 'green' },
      { id: 5, name: 'pink' },
    ])
    expect(store.getState().fruit.error).toBeNull()
    expect(store.getState().fruit.lastFetch).toBeNull()
    expect(store.getState().fruit.lastFetchParameters).toBeNull()
    expect(store.getState().fruit.loading).toEqual(false)
    expect(store.getState().fruit.metadata.occurences).toEqual(1)
    expect(store.getState().fruit.metadata.primary_keys).toEqual(['id'])
  })
  it('fill correctly the store on put without id', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([
          { id: 4, name: 'blue' },
          { id: 2, name: 'green' },
          { id: 5, name: 'pink' },
        ]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.fruit.success,
      objects: [{ id: 9, name: 'purple' }, { id: 8, name: 'orangered' }],
      metadata: { occurences: 2, primary_keys: ['id'] },
      method: 'PUT',
      parameters: {},
      batch: true,
    })
    expect(store.getState().fruit.objects).toEqual([
      { id: 9, name: 'purple' },
      { id: 8, name: 'orangered' },
    ])
    expect(store.getState().fruit.error).toBeNull()
    expect(store.getState().fruit.lastFetch).toBeNull()
    expect(store.getState().fruit.lastFetchParameters).toBeNull()
    expect(store.getState().fruit.loading).toEqual(false)
    expect(store.getState().fruit.metadata.occurences).toEqual(2)
    expect(store.getState().fruit.metadata.primary_keys).toEqual(['id'])
  })
  it('fill correctly the store on put with id', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([
          { id: 4, name: 'blue' },
          { id: 2, name: 'green' },
          { id: 5, name: 'pink' },
        ]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.fruit.success,
      objects: [{ id: 2, name: 'forestgreen' }],
      metadata: { occurences: 1, primary_keys: ['id'] },
      method: 'PUT',
      parameters: { id: 2 },
      batch: false,
    })
    expect(store.getState().fruit.objects).toEqual([
      { id: 4, name: 'blue' },
      { id: 5, name: 'pink' },
      { id: 2, name: 'forestgreen' },
    ])
    expect(store.getState().fruit.error).toBeNull()
    expect(store.getState().fruit.lastFetch).toBeNull()
    expect(store.getState().fruit.lastFetchParameters).toBeNull()
    expect(store.getState().fruit.loading).toEqual(false)
    expect(store.getState().fruit.metadata.occurences).toEqual(1)
    expect(store.getState().fruit.metadata.primary_keys).toEqual(['id'])
  })
  it('fill correctly the store on patch without id', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([
          { id: 4, name: 'blue' },
          { id: 2, name: 'green' },
          { id: 5, name: 'pink' },
        ]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.fruit.success,
      objects: [{ id: 4, name: 'indigo' }, { id: 5, name: 'cream' }],
      metadata: { occurences: 2, primary_keys: ['id'] },
      method: 'PATCH',
      parameters: {},
      batch: true,
    })
    expect(store.getState().fruit.objects).toEqual([
      { id: 2, name: 'green' },
      { id: 4, name: 'indigo' },
      { id: 5, name: 'cream' },
    ])
    expect(store.getState().fruit.error).toBeNull()
    expect(store.getState().fruit.lastFetch).toBeNull()
    expect(store.getState().fruit.lastFetchParameters).toBeNull()
    expect(store.getState().fruit.loading).toEqual(false)
    expect(store.getState().fruit.metadata.occurences).toEqual(2)
    expect(store.getState().fruit.metadata.primary_keys).toEqual(['id'])
  })
  it('fill correctly the store on patch with id', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([
          { id: 4, name: 'blue' },
          { id: 2, name: 'green' },
          { id: 5, name: 'pink' },
        ]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.fruit.success,
      objects: [{ id: 2, name: 'forestgreen' }],
      metadata: { occurences: 1, primary_keys: ['id'] },
      method: 'PATCH',
      parameters: { id: 2 },
      batch: false,
    })
    expect(store.getState().fruit.objects).toEqual([
      { id: 4, name: 'blue' },
      { id: 5, name: 'pink' },
      { id: 2, name: 'forestgreen' },
    ])
    expect(store.getState().fruit.error).toBeNull()
    expect(store.getState().fruit.lastFetch).toBeNull()
    expect(store.getState().fruit.lastFetchParameters).toBeNull()
    expect(store.getState().fruit.loading).toEqual(false)
    expect(store.getState().fruit.metadata.occurences).toEqual(1)
    expect(store.getState().fruit.metadata.primary_keys).toEqual(['id'])
  })
  it('fill correctly the store on delete without id', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([
          { id: 4, name: 'blue' },
          { id: 2, name: 'green' },
          { id: 5, name: 'pink' },
        ]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.fruit.success,
      objects: [
        { id: 4, name: 'blue' },
        { id: 2, name: 'green' },
        { id: 5, name: 'pink' },
      ],
      metadata: { occurences: 3, primary_keys: ['id'] },
      method: 'DELETE',
      parameters: {},
      batch: true,
    })
    expect(store.getState().fruit.objects).toEqual([])
    expect(store.getState().fruit.error).toBeNull()
    expect(store.getState().fruit.lastFetch).toBeNull()
    expect(store.getState().fruit.lastFetchParameters).toBeNull()
    expect(store.getState().fruit.loading).toEqual(false)
    expect(store.getState().fruit.metadata.occurences).toEqual(3)
    expect(store.getState().fruit.metadata.primary_keys).toEqual(['id'])
  })
  it('fill correctly the store on delete with id', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(
      reducer,
      {
        fruit: init([
          { id: 4, name: 'blue' },
          { id: 2, name: 'green' },
          { id: 5, name: 'pink' },
        ]),
        color: init(),
        tree: init(),
      },
      applyMiddleware(thunk)
    )

    store.dispatch({
      type: api.events.fruit.success,
      objects: [{ id: 2, name: 'forestgreen' }],
      metadata: { occurences: 1, primary_keys: ['id'] },
      method: 'DELETE',
      parameters: { id: 2 },
      batch: false,
    })
    expect(store.getState().fruit.objects).toEqual([
      { id: 4, name: 'blue' },
      { id: 5, name: 'pink' },
    ])
    expect(store.getState().fruit.error).toBeNull()
    expect(store.getState().fruit.lastFetch).toBeNull()
    expect(store.getState().fruit.lastFetchParameters).toBeNull()
    expect(store.getState().fruit.loading).toEqual(false)
    expect(store.getState().fruit.metadata.occurences).toEqual(1)
    expect(store.getState().fruit.metadata.primary_keys).toEqual(['id'])
  })

  it('does nothing on missing objects', () => {
    // When there's is a 202 success without objects for example
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:type?/:age?',
    })
    const reducer = combineReducers(api.reducers)
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch({
      type: api.events.color.success,
      metadata: { something: true },
      method: 'POST',
      parameters: {},
      batch: true,
    })
    expect(Object.keys(store.getState().color)).toEqual([
      'objects',
      'metadata',
      'loading',
      'error',
      'lastFetch',
      'lastFetchParameters',
    ])
    expect(store.getState().color.objects).toEqual([])
    expect(store.getState().color.error).toBeNull()
    expect(store.getState().color.lastFetch).toBeNull()
    expect(store.getState().color.lastFetchParameters).toBeNull()
    expect(store.getState().color.loading).toEqual(false)
    expect(store.getState().color.metadata.something).toBeTruthy()
  })
})
