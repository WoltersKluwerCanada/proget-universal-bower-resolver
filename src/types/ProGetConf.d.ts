declare interface ProGetConf {
    apiKeyMapping: ProGetApiConf[];
}

declare interface ProGetApiConf {
    server: string;
    _serverRegExp: RegExp;
    key: string;
}
