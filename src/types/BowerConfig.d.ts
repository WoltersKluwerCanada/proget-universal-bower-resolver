declare interface BowerConfig {
    httpsProxy: string;
    proxy: string;
    ca: string;
    strictSsl: boolean;
    timeout: number;
    request: string;
    proget: ProGetConf;
    retry?: number;
    registry: BowerConfigRegistry;
}

declare interface BowerConfigRegistry {
    search: Array<string>;
}
