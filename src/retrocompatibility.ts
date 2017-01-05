"use strict";

export default class RetroCompatibility {
    private sources: string[] = [];
    private proGetConfig: ProGetConf = {
        apiKeyMapping: []
    };
    private serverNames: string[] = [];

    constructor(config: BowerConfig) {
        if (config.hasOwnProperty("proget")) {
            this.readFrom01(config);
            this.readFrom02(config);
            this.readFrom03(config);
            this.merge(config);
        }
    }

    private static _deleteNoMoreUseProperties(properties: string[], config) {
        for (let x = 0, y = properties.length; x < y; ++x) {
            if (config.proget.hasOwnProperty(properties[x])) {
                delete config.proget[properties[x]];
            }
        }
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
        if (config.proget.hasOwnProperty("server") && config.proget.hasOwnProperty("apiKey")) {
            this.serverNames.push(config.proget.server);
            this.proGetConfig.apiKeyMapping.push({
                key: config.proget.apiKey,
                server: config.proget.server
            });
        }
        // Delete no more useful properties
        RetroCompatibility._deleteNoMoreUseProperties(["apiKey", "server", "feed", "group"], config);
    }

    private readFrom02(config: BowerConfig): void {
        // Add source
        if (config.proget.hasOwnProperty("apiKeyMapping") && config.proget.hasOwnProperty("registries")) {
            for (let x = 0, y = config.proget.registries.length; x < y; ++x) {
                this.sources.push(config.proget.registries[x]);
            }
        }
        // Delete no more useful properties
        RetroCompatibility._deleteNoMoreUseProperties(["registries"], config);
    }

    private readFrom03(config: BowerConfig): void {
        let pci: ProGetApiConf;
        let reg = /((\\.)|(\\\\)|(\.[*+?]))+/;

        if (config.proget.hasOwnProperty("apiKeyMapping") && config.proget.apiKeyMapping[0].hasOwnProperty("server")) {
            for (let x = 0, y = config.proget.apiKeyMapping.length; x < y; ++x) {
                pci = config.proget.apiKeyMapping[x];
                if (reg.test(pci.server)) {
                    this.sources.push(pci.server);

                    // Modify config
                    pci._serverRegExp = new RegExp(pci.server);

                    let index = this.sources.indexOf(pci.server);
                    if (index !== -1) {
                        this.sources.splice(index, 1);
                    }
                }
            }
        }
    }

    private merge(config: BowerConfig): void {
        if (!config.proget.hasOwnProperty("apiKeyMapping")) {
            config.proget.apiKeyMapping = [];
        }

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
            if (this.serverNames.indexOf(pci.server) !== -1) {
                this.serverNames.push(pci.server);
                pc.push(pci);
            }
        }
    }
}
