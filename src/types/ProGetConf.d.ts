declare interface ProGetConf {
    apiKeyMapping: ProGetApiConf[];
    // Deprecated options
    server?: string;
    feed?: string;
    apiKey?: string;
    group?: string;
}

declare interface ProGetApiConf {
    server: string;
    _serverRegExp?: RegExp;
    key: string;
}
