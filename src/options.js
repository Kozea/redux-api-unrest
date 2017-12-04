import transformer from './transformer'

export const defaults = {
  transformer,
  urlOptions: { qsStringifyOptions: { indices: false } },
}

export const withDefaults = endpoints =>
  Object.entries(endpoints).reduce((ep, [key, val]) => {
    if (typeof val === 'string') {
      val = {
        url: val,
      }
    }
    ep[key] = {
      ...defaults,
      ...val,
    }
    return ep
  }, {})
