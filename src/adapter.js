// This import may or may not be a good idea.
// It's needed but can be included by your app.
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

const storage = typeof localStorage == 'undefined' ? null : localStorage

const removeTrailingSlash = url => {
  const [path, search] = url.split('?', 2)
  if (search) {
    return [path.replace(/\/+$/, ''), search].join('?')
  }
  return path.replace(/\/+$/, '')
}

export default async (url, opts) => {
  opts.method = opts.method || 'GET'
  opts.headers = {
    Accept: 'application/json',
  }
  const jwt = storage && storage.getItem('jwt')
  if (jwt) {
    opts.headers.Authorization = `Bearer ${jwt}`
  }
  if (opts.method !== 'GET') {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(opts.body)
  }
  let response, json
  try {
    response = await fetch(removeTrailingSlash(url), opts)
  } catch (e) {
    throw new Error('Erreur lors de la récupération de données.')
  }
  if (response.status > 300 || response.status < 200) {
    // TODO: find a better solution. UNREST ?
    if (response.status === 404 && opts.method === 'GET') {
      return { occurences: 0, objects: [] }
    }
    if (response.status === 401 && storage) {
      storage.removeItem('jwt')
    }
    if (response.headers.get('Content-Type') !== 'application/json') {
      const text = await response.text()
      throw new Error(
        `Erreur ${response.status} lors de la récupération de données. ${text}`
      )
    }
    try {
      json = await response.json()
    } catch (e) {
      throw new Error('Erreur de lecture de l’erreur serveur. JSON invalide')
    }
    const newError = new Error(
      `Erreur ${response.status} serveur. ${json.message || json.description}`
    )
    json.method = opts.method || 'GET'
    newError.json = json
    throw newError
  }
  try {
    json = await response.json()
  } catch (e) {
    throw new Error('Erreur de lecture de la réponse serveur. JSON invalide')
  }
  if (response.headers.get('Authorization') && storage) {
    storage.setItem('jwt', response.headers.get('Authorization'))
  }
  return json
}
