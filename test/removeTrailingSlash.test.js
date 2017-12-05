import { removeTrailingSlash } from '../src/adapter'

describe('Trailing slash remover', () => {
  it('Trails slash', () => {
    expect(removeTrailingSlash('http://kozea.fr/')).toEqual('http://kozea.fr')
    expect(removeTrailingSlash('http://kozea.fr/part/path/')).toEqual(
      'http://kozea.fr/part/path'
    )
  })

  it('Does nothing when no trailing slash', () => {
    expect(removeTrailingSlash('http://kozea.fr')).toEqual('http://kozea.fr')
    expect(removeTrailingSlash('http://kozea.fr/part/path')).toEqual(
      'http://kozea.fr/part/path'
    )
    expect(
      removeTrailingSlash('http://kozea.fr/part/path?page=1&lang=fr')
    ).toEqual('http://kozea.fr/part/path?page=1&lang=fr')
  })

  it('Trails slash with a query', () => {
    expect(removeTrailingSlash('http://kozea.fr/?page=1')).toEqual(
      'http://kozea.fr?page=1'
    )
    expect(removeTrailingSlash('http://kozea.fr/part/path/?page=1')).toEqual(
      'http://kozea.fr/part/path?page=1'
    )
    expect(
      removeTrailingSlash('http://kozea.fr/part/path/?page=1&lang=fr')
    ).toEqual('http://kozea.fr/part/path?page=1&lang=fr')
  })
})
