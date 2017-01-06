"use strict";

export default class RetroCompatibility {
    public static parse(config: BowerConfig): void {
        const tc = new RetroCompatibility(config);
    }

    private static _deleteNoMoreUseProperties(properties: string[], config) {
        const propertiesL = properties.length;
        for (let x = 0; x < propertiesL; ++x) {
            if (config.proget.hasOwnProperty(properties[x])) {
                delete config.proget[properties[x]];
            }
        }
    }

    private sources: string[] = [];
    private proGetConfig: ProGetConf = {
        apiKeyMapping: []
    };
    private serverNames: string[] = [];

    private constructor(config: BowerConfig) {
        if (config.hasOwnProperty("proget")) {
            this.readFrom01(config);
            this.readFrom02(config);
            this.readFrom03(config);
            this.merge(config);
        }
    }

    private readFrom01(config: BowerConfig): void {
        // Add source
        if (config.proget.hasOwnProperty("server") && config.proget.hasOwnProperty("feed")) {
            const s = `${config.proget.server.replace(/\/$/, "")}/upack/${config.proget.feed}`;
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
            const registriesL = config.proget.registries.length;
            for (let x = 0; x < registriesL; ++x) {
                this.sources.push(config.proget.registries[x]);
            }
        }
        // Delete no more useful properties
        RetroCompatibility._deleteNoMoreUseProperties(["registries"], config);
    }

    private readFrom03(config: BowerConfig): void {
        let pci: ProGetApiConf;
        const reg = /((\\.)|(\\\\)|(\.[*+?]))+/;

        if (config.proget.hasOwnProperty("apiKeyMapping") && config.proget.apiKeyMapping[0].hasOwnProperty("server")) {
            const apiKeyMappingL = config.proget.apiKeyMapping.length;
            for (let x = 0; x < apiKeyMappingL; ++x) {
                pci = config.proget.apiKeyMapping[x];
                if (reg.test(pci.server)) {
                    this.sources.push(pci.server);

                    // Modify config
                    pci._serverRegExp = new RegExp(pci.server);

                    const index = this.sources.indexOf(pci.server);
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
        const thisSourcesL = this.sources.length;
        for (let x = 0; x < thisSourcesL; ++x) {
            if (sources.indexOf(this.sources[x]) === -1) {
                sources.push(this.sources[x]);
            }
        }

        // Parse the server config
        const pc = config.proget.apiKeyMapping;
        let pci: ProGetApiConf;
        const apiKeyMappingL = this.proGetConfig.apiKeyMapping.length;
        for (let i = 0; i < apiKeyMappingL; ++i) {
            pci = this.proGetConfig.apiKeyMapping[i];
            if (this.serverNames.indexOf(pci.server) !== -1) {
                this.serverNames.push(pci.server);
                pc.push(pci);
            }
        }
    }
}
