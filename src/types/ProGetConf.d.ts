declare class ProGetConf {
    apiKeyMapping: Array<ProGetApiConf>;
}

declare class ProGetApiConf {
    server: RegExp;
    key: string;
}
