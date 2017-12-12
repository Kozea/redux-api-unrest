export const timeout = time => new Promise(resolve => setTimeout(resolve, time))
export const isEmpty = o =>
  Object.keys(o).length === 0 && o.constructor === Object
