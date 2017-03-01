# Changelog

## v0.5.0 - 2017-02-xx

- Add: Support for HTTP redirection.
- Add: Support for HTTP authentication, using the .npmrc data.
- Fix: Make the "retry" module work correctly.

## v0.4.3 - 2017-02-08

- Fix: Fix an `EEXIST` error that can happen if Bower call the resolver fast enough for the temp library to return twice (or more) the same folder name.

## v0.4.2 - 2017-02-07

- Fix: Repair resolver `ERESOLERAPI` error when use by Bower.

## v0.4.1 - 2017-02-07

- Add: Log more information on console, like the rest of Bower already does.
- Fix: A possible error with the retro compatibility module has been fixed.
- Internally: Convert tests to TypeScript.
- Internally: Remove JsDoc comments since TypeScript is enough verbose as is.
- Internally: Change the decompression lib for an async one and who still under support.

## v0.4.0 - 2017-01-06

- Change: The parameter `proget.apiKeyMapping.server` is back to be a `string` because "RegExp in configuration file is ugly. A lot more if you need to double escape it." (@franknarf8 comment :wink:).
- Add: Tool configuration retro-compatibility support!

## v0.3.0 - 2016-12-19

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
