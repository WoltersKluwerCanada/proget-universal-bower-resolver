"use strict";

export default class Retrocompatibility {
    private sources: string[] = [];
    private proGetConfig: ProGetConf = {
        apiKeyMapping: []
    };
    private serverNames: string[];

    constructor(config: BowerConfig) {
        this.readFrom01(config);
        this.readFrom02(config);
        this.readFrom03(config);
        this.merge(config);
    }

    private readFrom01(config: BowerConfig): void {
        // Add source
        if (config.proget.hasOwnProperty("server") && config.proget.hasOwnProperty("feed")) {
            let s = `${config.proget.server.replace(/\/$/, "")}/upack/${config.proget.feed}`;
            if (this.sources.indexOf(s) === -1) {
                this.sources.push(s);
            }
        }
        // Add config
        if (config.proget.hasOwnProperty("server") && config.proget.hasOwnProperty("api")) {
            this.serverNames.push(config.proget.server);
            config.proget.apiKeyMapping.push({
                key: config.proget.apiKey,
                server: config.proget.server
            });
        }
    }

    private readFrom02(config: BowerConfig): void {
        let pci: ProGetApiConf;

        // Add source
        if (config.proget.hasOwnProperty("apiKeyMapping") && config.proget.apiKeyMapping.hasOwnProperty("server")) {
            let reg = /.+\/upack\/.*/;

            for (let x = 0, y = config.proget.apiKeyMapping.length; x < y; ++x) {
                pci = config.proget.apiKeyMapping[x];
                if (reg.test(pci.server)) {
                    this.sources.push(pci.server);

                    // Modify config
                    pci.server = pci.server.replace(/\/upack\/.*/, "");
                }
            }
        }
    }

    private readFrom03(config: BowerConfig): void {
        let pci: ProGetApiConf;

        if (config.proget.hasOwnProperty("apiKeyMapping") && config.proget.apiKeyMapping.hasOwnProperty("server")) {
            let reg = /(\\.)|(\\\\)|(\.[*+?])/;

            for (let x = 0, y = config.proget.apiKeyMapping.length; x < y; ++x) {
                pci = config.proget.apiKeyMapping[x];
                if (reg.test(pci.server)) {
                    this.sources.push(pci.server);

                    // Modify config
                    pci._serverRegExp = new RegExp(pci.server);
                }
            }
        }
    }

    private merge(config: BowerConfig): void {
        // Parse the registries
        const sources = config.registry.search;
        for (let x = 0, y = this.sources.length; x < y; ++x) {
            if (sources.indexOf(this.sources[x]) === -1) {
                sources.push(this.sources[x]);
            }
        }

        // Parse the server config
        const pc = config.proget.apiKeyMapping;
        let pci: ProGetApiConf;

        for (let i = 0, j = this.proGetConfig.apiKeyMapping.length; i < j; ++i) {
            pci = this.proGetConfig.apiKeyMapping[i];
            if (this.serverNames.indexOf(pci.server) === -1) {
                this.serverNames.push(pci.server);
                pc.push(pci);
            }
        }
    }
}
