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

    private static convertNpmrcToJson(npmrcContent: string): Map<string, AuthToken> {
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

    private static mergeConfig(...configs: Array<Map<string, AuthToken>>): Map<string, AuthToken> {
        let out = new Map();

        if (arguments.length !== 0) {
            if (arguments[0] && arguments[0] instanceof Map) {
                out = arguments[0];
            }

            // Parse the other configurations, the previous has priority on the second or each keys
            for (const argument of arguments) {
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

    public cwd = process.cwd();
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

    private setCache(): void {
        // Read the project config
        const projectConfig = Authentication.convertNpmrcToJson(this.readConfigFile(this.cwd));

        // Read the user config
        const userConfig = Authentication.convertNpmrcToJson(this.readConfigFile(os.homedir()));

        // TODO In the future find a way to read the global config

        this.cache = Authentication.mergeConfig(projectConfig, userConfig);
    }

    private readConfigFile(filePath: string): string {
        try {
            return fs.readFileSync(path.join(filePath, this.passwordFile), "utf8");
        } catch (e) {
            return "";
        }
    }
}
