declare interface BowerConfig {
    httpsProxy?: string;
    proxy?: string;
    ca?: any;
    color?: boolean;
    directory?: string;
    interactive?: boolean;
    strictSsl?: boolean;
    timeout?: number;
    request?: string;
    proget?: ProGetConf;
    retry?: number;
    registry: BowerConfigRegistry;
    resolvers?: string[];
}

declare interface BowerConfigRegistry {
    default?: string;
    publish?: string;
    register?: string;
    search: string[];
}
