# Changelog

## v0.3.0 - 2016-12-xx

- Add: Now some warning will be displayed if you still have some "old proget-universal-bower-resolver configuration" parameters in your `.bowerrc` config file.
- Change: The tool change the format of the `.bowerrc` `proget` part is use. We now use the standard `registry.search` section instead of a custom one.
- Fix: With the old implementation, when a package was found in the first feed, the resolver don't check in the second and then, some time, don't acquire the last package version.
- Fix: Now when a server call fail, the error is displayed with some debug information, not just `[Object, Object]`.
- Internally: Rewrite the whole code in TypeScript.
- Internally: Change the way the NPM package is build.
- Internally: Add Node.js v7 as test environment.

## v0.2.0 - 2016-10-21

- Add: Multiple ProGet universal feed support.
- Change: `feed` and `group` are no more exist in the configuration. `feed` is now determined by the `.bowerrc` `registry` section and `group` is now fixed to `bower`.

## v0.1.0 - 2016-09-25

- Initial deploy.
