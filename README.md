[![dependencies Status](https://david-dm.org/WoltersKluwerCanada/proget-universal-bower-resolver/status.svg)](https://david-dm.org/WoltersKluwerCanada/proget-universal-bower-resolver)

# ProGet Universal Bower Resolver

This Bower resolver allow you to download and install archives from a ProGet Universal Feed like any Bower package.

## Install
This tool can be install globally
```
npm install -g proget-universal-bower-resolver
```
or locally
```
npm install proget-universal-bower-resolver
```

## How To Use

Add/modify the `.bowerrc` file:
```text
{
    [...]
    "proget": {
        "server": "http(s)://<String>",
        "apiKey": "<String>",
        "feed": "<Number|String>",
        "group": "<String; default: bower>"
    },
    "resolvers": [
        "proget-universal-bower-resolver"
    ]
}
```

Where:

| key           | Description | Require | Default Value |
|---------------|-------------|---------|---------------|
| proget.server | Is the address to the ProGet server. | YES | |
| proget.apiKey | Is the API_Key use to communicate with the API. | YES | |
| proget.feed   | Is the `ID` or the `name` of the feed. | YES | |
| proget.group  | Is the group of the package. | NO | `"bower"` |

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
        <new_package_name>": ""<pkg_name>#<version>",
        [...]
    }
}
```
