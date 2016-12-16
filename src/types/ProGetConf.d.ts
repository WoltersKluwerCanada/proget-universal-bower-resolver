declare interface ProGetConf {
    apiKeyMapping: Array<ProGetApiConf>;
}

declare interface ProGetApiConf {
    server: RegExp;
    key: string;
}
