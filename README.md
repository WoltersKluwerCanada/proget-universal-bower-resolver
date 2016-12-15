[![dependencies Status](https://david-dm.org/WoltersKluwerCanada/proget-universal-bower-resolver/status.svg)](https://david-dm.org/WoltersKluwerCanada/proget-universal-bower-resolver) [![Build Status](https://travis-ci.org/WoltersKluwerCanada/proget-universal-bower-resolver.svg?branch=master)](https://travis-ci.org/WoltersKluwerCanada/proget-universal-bower-resolver) [![Coverage Status](https://coveralls.io/repos/github/WoltersKluwerCanada/proget-universal-bower-resolver/badge.svg?branch=master)](https://coveralls.io/github/WoltersKluwerCanada/proget-universal-bower-resolver?branch=master)

# ProGet Universal Bower Resolver

This Bower resolver allows you to download and install archives from a ProGet Universal Feed like any Bower package.

## Install
This tool can be installed globally
```
npm install -g proget-universal-bower-resolver
```
or locally
```
npm install proget-universal-bower-resolver
```

## How To Use

Add/modify the `.bowerrc` file:
```javascript
{
    /* [...] */
    "proget": {
        "apiKeyMapping": [
            {
                "server": "serverRegEx; ex: http(s)?:\\/\\/.*\\/upack\\/.*",
                "key" : "<String>"
            }
            /* [...] */
        ]
    },
    "resolvers": [
        "proget-universal-bower-resolver"
    ]
}
```

Where:

| Key                         | Description                                                         | Require                                              |
|-----------------------------|---------------------------------------------------------------------|------------------------------------------------------|
| proget.server               | Is the address to the ProGet server.                                | NO only if `proget.apiKeyMapping` is set             |
| proget.apiKey               | Is the API_Key use to communicate with the API.                     | NO only if `proget.apiKeyMapping` is set             |
| proget.apiKeyMapping.server | Is the address to a ProGet server.                                  | At least one object if `proget.apiKeyMapping` is set |
| proget.apiKeyMapping.Key    | Is the API_Key use to communicate with the API of the above server. | At least one object if `proget.apiKeyMapping` is set |


And the way to create your dependencies is like you normally will do:
```text
{
    [...],
    "dependencies": {
        "<package>": "<version>",
        [...]
    }
}
```

### Rename packages

If you want to rename your packages write the dependence as normal:

```txt
{
    [...],
    "dependencies": {
        "<new_package_name>": "<pkg_name>#<version>",
        [...]
    }
}
```
