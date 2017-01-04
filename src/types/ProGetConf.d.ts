declare interface ProGetConf {
    apiKeyMapping: Array<ProGetApiConf>;
}

declare interface ProGetApiConf {
    server: string;
    _serverRegExp: RegExp;
    key: string;
}
