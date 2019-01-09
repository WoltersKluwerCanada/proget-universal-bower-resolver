declare interface IBowerConfig {
    httpsProxy?: string;
    proxy?: string;
    ca?: any;
    color?: boolean;
    directory?: string;
    interactive?: boolean;
    strictSsl?: boolean;
    timeout?: number;
    request?: string;
    proget?: IProGetConf;
    retry?: number;
    registry: IBowerConfigRegistry;
    resolvers?: string[];
}

declare interface IBowerConfigRegistry {
    default?: string;
    publish?: string;
    register?: string;
    search: string[];
}
