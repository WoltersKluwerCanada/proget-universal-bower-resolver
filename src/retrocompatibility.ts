"use strict";

export default class RetroCompatibility {
    public static parse(config: BowerConfig): void {
        const tc = new RetroCompatibility(config);
    }

    private static _deleteNoMoreUseProperties(properties: string[], config) {
        for (const property of properties) {
            if (config.proget.hasOwnProperty(property)) {
                delete config.proget[property];
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
            for (const source of config.proget.registries) {
                this.sources.push(source);
            }
        }
        // Delete no more useful properties
        RetroCompatibility._deleteNoMoreUseProperties(["registries"], config);
    }

    private readFrom03(config: BowerConfig): void {
        let proGetApiConf: ProGetApiConf;
        const reg = /((\\.)|(\\\\)|(\.[*+?]))+/;

        if (config.proget.hasOwnProperty("apiKeyMapping")
            && config.proget.apiKeyMapping.length > 0
            && config.proget.apiKeyMapping[0].hasOwnProperty("server")) {

            for (const apiKeyMapping of config.proget.apiKeyMapping) {
                proGetApiConf = apiKeyMapping;
                if (reg.test(proGetApiConf.server)) {
                    this.sources.push(proGetApiConf.server);

                    // Modify config
                    proGetApiConf._serverRegExp = new RegExp(proGetApiConf.server);

                    const index = this.sources.indexOf(proGetApiConf.server);
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
        for (const source of this.sources) {
            if (sources.indexOf(source) === -1) {
                sources.push(source);
            }
        }

        // Parse the server config
        const proGetConf = config.proget.apiKeyMapping;
        for (const pci of this.proGetConfig.apiKeyMapping) {
            if (this.serverNames.indexOf(pci.server) !== -1) {
                this.serverNames.push(pci.server);
                proGetConf.push(pci);
            }
        }
    }
}
