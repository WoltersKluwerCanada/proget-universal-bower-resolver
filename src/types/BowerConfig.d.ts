declare class BowerConfig {
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

declare class BowerConfigRegistry {
    search: Array<string>;
}
