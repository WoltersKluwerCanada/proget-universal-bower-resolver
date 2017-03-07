"use strict";

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as url from "url";

let instance;

export default class Authentication {
    public static getInstance(): Authentication {
        if (!instance) {
            instance = new Authentication();
        }

        return instance;
    }

    public static nerf(uri: string): string {
        const parsed = url.parse(uri);
        delete parsed.protocol;
        delete parsed.auth;
        delete parsed.query;
        delete parsed.search;
        delete parsed.hash;

        return url.resolve(url.format(parsed).replace(/(upack|bower).*/, "npm/"), ".");
    }

    private static convertNpmrcAuthToJson(npmrcContent: string): Map<string, AuthToken> {
        const out = new Map();

        const foundUrlAuthInfo = /(.*):_password="(.+)"(?:\r|\n){1,2}.*username=([a-zA-Z.0-9]*)/g;
        let m = foundUrlAuthInfo.exec(npmrcContent);

        while (m !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === foundUrlAuthInfo.lastIndex) {
                foundUrlAuthInfo.lastIndex++;
            }

            if (m.length === 4 && m[1].length > 0 && m[2].length > 0 && m[3].length > 0) {
                out[m[1]] = {password: new Buffer(m[2], "base64").toString(), username: m[3]};
            }

            m = foundUrlAuthInfo.exec(npmrcContent);
        }

        return out;
    }

    private static mergeConfig(configs: Array<Map<string, AuthToken>>): Map<string, AuthToken> {
        let out = new Map();

        if (configs.length !== 0) {
            if (configs[0] && configs[0] instanceof Map) {
                out = configs[0];
            }

            // Parse the other configurations, the previous has priority on the second or each keys
            for (const argument of configs) {
                if (argument) {
                    for (const authToken in argument) {
                        if (argument.hasOwnProperty(authToken) && !out.hasOwnProperty(authToken)) {
                            out[authToken] = argument[authToken];
                        }
                    }
                }
            }
        }

        return out;
    }

    private possibleDirectories: string[] = [process.cwd()];
    private passwordFile: string = ".npmrc";
    private cache: Map<string, AuthToken>;

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

    public  addPossibleConfigFolder(folder: string): void {
        this.possibleDirectories.unshift(folder);
    }

    private setCache(): void {
        const out: Array<Map<string, AuthToken>> = [];

        out.push(this.cache);

        for (const directory of this.possibleDirectories) {
            out.push(Authentication.convertNpmrcAuthToJson(this.readConfigFile(directory)));
        }

        // Read the user config
        out.push(Authentication.convertNpmrcAuthToJson(this.readConfigFile(os.homedir())));

        // TODO In the future find a way to read the global config

        this.cache = Authentication.mergeConfig(out);
    }

    private readConfigFile(filePath: string): string {
        try {
            return fs.readFileSync(path.join(filePath, this.passwordFile), "utf8");
        } catch (e) {
            return "";
        }
    }
}
