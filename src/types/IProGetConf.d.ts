declare interface IProGetConf {
    apiKeyMapping: IProGetApiConf[];
    // Deprecated options
    server?: string;
    feed?: string;
    apiKey?: string;
    group?: string;
    registries?: string[];
}

declare interface IProGetApiConf {
    server: string;
    _serverRegExp?: RegExp;
    key: string;
}
