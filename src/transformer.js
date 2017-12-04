// Determines if two objects are equal according to the given pks
const pkEqual = pks => (o1, o2) => pks.every(pk => o1[pk] === o2[pk])

// A filter that only returns objects that are not in the given list
const notIn = pks => objects => object =>
  !objects.some(o => pkEqual(pks)(o, object))

// This is a reduxApi transformer that works with unrest responses
export default (data, olds, action) => {
  if (!data) {
    return []
  }
  const { objects, primary_keys: pks } = data

  // We add the number of occurences as an extra parameter
  action.request.extras = { occurences: data.occurences }
  const method = action.request.params ? action.request.params.method : ''
  switch (method) {
    case 'POST':
      // In case of a POST we concatenate the new data to the old
      return [...olds, ...objects]
    case 'PUT':
      // In case of a PUT we replace all if it's a batch
      if (!Object.keys(action.request.pathvars).length) {
        // If there's no path variables it's a batch PUT so
        return [...objects]
      }
    // In case of a PUT one we replace the one that changed
    // Since it's exactly like PATCH we are falling through
    // eslint-disable-next-line no-fallthrough
    case 'PATCH':
      // In case of a PATCH we replace the element that changed
      // Old objects without the updated new objects + the new objects
      return [...olds.filter(notIn(pks)(objects)), ...objects]
    case 'DELETE':
      // In case of a DELETE we remove all
      return [...olds.filter(notIn(pks)(objects))]
  }

  return objects
}
