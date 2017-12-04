export const DEFAULT_METHODS = ['get', 'put', 'post', 'patch', 'delete']

// CRUD helper for redux-api. Allow the use of method like api.actions.put({})
// Usage:
// * dispatch(api.actions.endpoint.get(cb))
// * dispatch(api.actions.endpoint.get(params))
// * dispatch(api.actions.endpoint.post(obj, cb))
// * dispatch(api.actions.endpoint.patch(obj, params, cb))
export const crud = methods =>
  // For each of the provided methods
  (methods || DEFAULT_METHODS).reduce((map, name) => {
    // Returns the helper function for the method
    // TODO: Think about how improving the async there (promise + cb = :/)
    map[name] = (body, params, cb) => {
      // If the method does not take a body the argument list is (params, cb)
      if (name === 'get' || name === 'delete') {
        params = body
        cb = params
        body = void 0
      }
      // The params argument can be omitted
      if (params instanceof Function) {
        cb = params
        params = {}
      }

      return [params, { body, method: name.toUpperCase() }, cb || (() => {})]
    }
    return map
  }, {})
