## [0.8.0](https://github.com/Kozea/redux-api-unrest/compare/v0.7.4...v0.8.0)

- Use fetch AbortController when available. Polyfill otherwise.

## [0.7.4](https://github.com/Kozea/redux-api-unrest/compare/v0.7.3...v0.7.4)

- Do not reset after fetch abort to prevent unecessary rendering

## [0.7.3](https://github.com/Kozea/redux-api-unrest/compare/v0.7.2...v0.7.3)

- Prevent crash with safari private mode for localStorage

## [0.7.2](https://github.com/Kozea/redux-api-unrest/compare/v0.7.1...v0.7.2)

- Update deps.

## [0.7.1](https://github.com/Kozea/redux-api-unrest/compare/v0.7.0...v0.7.1)

- Add fetch `payload` and restrict `parameters` to url parameters in `metadata`.

# [0.7.0](https://github.com/Kozea/redux-api-unrest/compare/v0.6.4...v0.7.0)

- Add fetch `url`, `method` and `parameters` in `metadata` in store when loading (FETCH action).
- Update deps.

## [0.6.4](https://github.com/Kozea/redux-api-unrest/compare/v0.6.3...v0.6.4)

- Update deps.

## [0.6.3](https://github.com/Kozea/redux-api-unrest/compare/v0.6.2...v0.6.3)

- Fix force bug when request got cached after abort.

## [0.6.2](https://github.com/Kozea/redux-api-unrest/compare/v0.6.1...v0.6.2)

- Don't try to merge objects if there is no objects in response.

## [0.6.1](https://github.com/Kozea/redux-api-unrest/compare/v0.6.0...v0.6.1)

- Dependencies update

## [0.6.0](https://github.com/Kozea/redux-api-unrest/compare/v0.5.3...v0.6.0)

- Add abort on reset.
- Add .force methods to force abort on previously loading endpoints.

## [0.5.3](https://github.com/Kozea/redux-api-unrest/compare/v0.5.2...v0.5.3)

- Add a reset action.

## [0.5.2](https://github.com/Kozea/redux-api-unrest/compare/v0.5.1...v0.5.2)

- Add json content on http error when response is json.

## [0.5.1](https://github.com/Kozea/redux-api-unrest/compare/v0.5.0...v0.5.1)

- Fix various packaging problems.

# [0.5.0](https://github.com/Kozea/redux-api-unrest/compare/v0.4.0...v0.5.0)

- Use uppercase methods.

# [0.4.0](https://github.com/Kozea/redux-api-unrest/compare/v0.3.2...v0.4.0)

- Replace `methodAll()` functions with `method()` and `method()` with `methodItem()`.

## [0.3.2](https://github.com/Kozea/redux-api-unrest/compare/v0.3.1...v0.3.2)

- Add fetch result / error as promise resolve.

## [0.3.1](https://github.com/Kozea/redux-api-unrest/compare/v0.3.0...v0.3.1)

- Patch for bad utils import.

# [0.3.0](https://github.com/Kozea/redux-api-unrest/compare/v0.2.3...v0.3.0)

- Add support for query parameters as payload argument for get method.
