import ApiUnrest from '../src'

describe('It generates correctly the events', () => {
  it('For a basic example', () => {
    const api = new ApiUnrest({
      fruit: 'fruit',
      color: 'base/color/:id?',
      tree: 'forest/tree/:size?/:age?',
    })
    expect(api.events.fruit).toEqual({
      cache: '@@api-unrest/api/fruit/CACHE',
      error: '@@api-unrest/api/fruit/ERROR',
      fetch: '@@api-unrest/api/fruit/FETCH',
      success: '@@api-unrest/api/fruit/SUCCESS',
    })
    expect(api.events.color).toEqual({
      cache: '@@api-unrest/api/color/CACHE',
      error: '@@api-unrest/api/color/ERROR',
      fetch: '@@api-unrest/api/color/FETCH',
      success: '@@api-unrest/api/color/SUCCESS',
    })
    expect(api.events.tree).toEqual({
      cache: '@@api-unrest/api/tree/CACHE',
      error: '@@api-unrest/api/tree/ERROR',
      fetch: '@@api-unrest/api/tree/FETCH',
      success: '@@api-unrest/api/tree/SUCCESS',
    })
  })
  it('With another rootPrefix', () => {
    const api = new ApiUnrest(
      {
        fruit: 'fruit',
        color: 'base/color/:id?',
        tree: 'forest/tree/:size?/:age?',
      },
      { prefix: 'root' }
    )
    expect(api.events.fruit).toEqual({
      cache: '@@api-unrest/root/fruit/CACHE',
      error: '@@api-unrest/root/fruit/ERROR',
      fetch: '@@api-unrest/root/fruit/FETCH',
      success: '@@api-unrest/root/fruit/SUCCESS',
    })
    expect(api.events.color).toEqual({
      cache: '@@api-unrest/root/color/CACHE',
      error: '@@api-unrest/root/color/ERROR',
      fetch: '@@api-unrest/root/color/FETCH',
      success: '@@api-unrest/root/color/SUCCESS',
    })
    expect(api.events.tree).toEqual({
      cache: '@@api-unrest/root/tree/CACHE',
      error: '@@api-unrest/root/tree/ERROR',
      fetch: '@@api-unrest/root/tree/FETCH',
      success: '@@api-unrest/root/tree/SUCCESS',
    })
  })
})
