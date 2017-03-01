"use strict";

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as url from "url";

let instance;

export default class Authentication {
    private passwordFile: string = ".npmrc";
    private cache: Map<string, AuthToken>;
    public cwd = process.cwd();

    public static getInstance(): Authentication {
        if (!instance) {
            instance = new Authentication();
        }

        return instance;
    }

    public getCredentialsByURI(uri: string): AuthToken | null {
        const nerfed = Authentication.nerf(uri);

        // Look in cache first
        if (this.cache && nerfed in this.cache) {
            return this.cache[nerfed];
        }

        // Read the config file
        instance.setCache();

        // Retry to access the cache
        if (this.cache && nerfed in this.cache) {
            return this.cache[nerfed];
        } else {
            return;
        }
    }

    private static nerf(uri: string): string {
        const parsed = url.parse(uri);
        delete parsed.protocol;
        delete parsed.auth;
        delete parsed.query;
        delete parsed.search;
        delete parsed.hash;

        return url.resolve(url.format(parsed), '.');
    }

    private setCache(): void {
        // Read the project config
        const projectConfig = Authentication.convertNpmrcToJson(this.readConfigFile(this.cwd));

        // Read the user config
        const userConfig = Authentication.convertNpmrcToJson(this.readConfigFile(os.homedir()));

        // TODO In the future find a way to read the global config
        // // Read the global config
        // const globalConfig = this.convertNpmrcToJson(this.readConfigFile(path.join(global.execPath, "..", ".npmrc")));
        const globalConfig = new Map;

        this.cache = Authentication.mergeConfig(projectConfig, userConfig, globalConfig);
    }

    private readConfigFile(filePath: string): string {
        try {
            return fs.readFileSync(path.join(filePath, this.passwordFile), "utf8");
        } catch (e) {
            return "";
        }
    }

    private static convertNpmrcToJson(npmrcContent: string): Map<string, AuthToken> {
        let out = new Map;

        const foundUrlAuthInfo = /(.*):_password="(.+)"\n.*username=(.*)/g;
        const noStartSlashes = /^\/\//;
        let m;

        while ((m = foundUrlAuthInfo.exec(npmrcContent)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === foundUrlAuthInfo.lastIndex) {
                foundUrlAuthInfo.lastIndex++;
            }

            if (m.length === 4 && m[1].length > 0 && m[2].length > 0 && m[3].length > 0) {
                out[Authentication.nerf(m[1].replace(noStartSlashes, ""))] = {password: m[2], username: m[3]}
            }
        }

        return out;
    }

    private static mergeConfig(...configs: Map<string, AuthToken>[]): Map<string, AuthToken> {
        let out = new Map;

        if (arguments.length !== 0) {
            if (arguments[0] && arguments[0] instanceof Map) {
                out = arguments[0];
            }

            // Parse the other configurations, the previous has priority on the second or each keys
            for (let i = 1, j = arguments.length; i < j; ++i) {
                if (arguments[i]) {
                    for (let authToken in arguments[i]) {
                        if (arguments[i].hasOwnProperty(authToken) && !out.hasOwnProperty(authToken)) {
                            out[authToken] = arguments[i][authToken];
                        }
                    }
                }
            }
        }

        return out;
    }
}
