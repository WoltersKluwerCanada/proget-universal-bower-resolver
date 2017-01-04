declare interface ProGetConf {
    apiKeyMapping: Array<ProGetApiConf>;
}

declare interface ProGetApiConf {
    server: string;
    _serverRegEx: RegExp;
    key: string;
}
