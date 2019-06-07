import ApiUnrest from '../src'
import { timeout } from './utils'

describe('Fetch Handler', () => {
  it('can be used directly', async () => {
    const api = new ApiUnrest(
      {},
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
              objects: ['response'],
            }),
          }
        },
      }
    )
    const response = await api.fetchHandler('/url', 'GET')
    expect(response).toEqual({ code: 200, objects: ['response'] })
  })
  it('supports non json response', async () => {
    const api = new ApiUnrest(
      {},
      {
        fetch: async () => {
          await timeout(25)
          return {
            status: 200,
            headers: {
              get: key =>
                ({
                  'Content-Type': 'text/plain',
                }[key]),
            },
            blob: () => 'the-blob',
          }
        },
      }
    )
    const response = await api.fetchHandler('/url', 'GET')
    expect(response).toEqual('the-blob')
  })
})
it('supports no content-type answers', async () => {
  const api = new ApiUnrest(
    {},
    {
      fetch: async () => {
        await timeout(25)
        return {
          status: 200,
          headers: {
            get: key => ({}[key]),
          },
          blob: () => 'the-blob',
        }
      },
    }
  )
  const response = await api.fetchHandler('/url', 'GET')
  expect(response).toEqual('the-blob')
})
