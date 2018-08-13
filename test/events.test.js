import ApiUnrest from '../src'

describe('Api-unrest events generation', () => {
  it('generates all of them for a basic example', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:size?/:age?',
    })
    expect(api.events.fruit).toEqual({
      abort: '@@api-unrest/api/fruit/ABORT',
      cache: '@@api-unrest/api/fruit/CACHE',
      error: '@@api-unrest/api/fruit/ERROR',
      fetch: '@@api-unrest/api/fruit/FETCH',
      success: '@@api-unrest/api/fruit/SUCCESS',
      reset: '@@api-unrest/api/fruit/RESET',
    })
    expect(api.events.color).toEqual({
      abort: '@@api-unrest/api/color/ABORT',
      cache: '@@api-unrest/api/color/CACHE',
      error: '@@api-unrest/api/color/ERROR',
      fetch: '@@api-unrest/api/color/FETCH',
      success: '@@api-unrest/api/color/SUCCESS',
      reset: '@@api-unrest/api/color/RESET',
    })
    expect(api.events.tree).toEqual({
      abort: '@@api-unrest/api/tree/ABORT',
      cache: '@@api-unrest/api/tree/CACHE',
      error: '@@api-unrest/api/tree/ERROR',
      fetch: '@@api-unrest/api/tree/FETCH',
      success: '@@api-unrest/api/tree/SUCCESS',
      reset: '@@api-unrest/api/tree/RESET',
    })
  })
  it('takes in account the prefix', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:size?/:age?',
      },
      { prefix: 'root' }
    )
    expect(api.events.fruit).toEqual({
      abort: '@@api-unrest/root/fruit/ABORT',
      cache: '@@api-unrest/root/fruit/CACHE',
      error: '@@api-unrest/root/fruit/ERROR',
      fetch: '@@api-unrest/root/fruit/FETCH',
      success: '@@api-unrest/root/fruit/SUCCESS',
      reset: '@@api-unrest/root/fruit/RESET',
    })
    expect(api.events.color).toEqual({
      abort: '@@api-unrest/root/color/ABORT',
      cache: '@@api-unrest/root/color/CACHE',
      error: '@@api-unrest/root/color/ERROR',
      fetch: '@@api-unrest/root/color/FETCH',
      success: '@@api-unrest/root/color/SUCCESS',
      reset: '@@api-unrest/root/color/RESET',
    })
    expect(api.events.tree).toEqual({
      abort: '@@api-unrest/root/tree/ABORT',
      cache: '@@api-unrest/root/tree/CACHE',
      error: '@@api-unrest/root/tree/ERROR',
      fetch: '@@api-unrest/root/tree/FETCH',
      success: '@@api-unrest/root/tree/SUCCESS',
      reset: '@@api-unrest/root/tree/RESET',
    })
  })
})
