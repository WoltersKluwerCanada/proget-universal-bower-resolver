"use strict";

import * as request from "request";
import * as semver from "semver";
import * as Url from "url";
import createError from "./createError";
import RetroCompatibility from "./retrocompatibility";
import Authentication from "./Authentication";

/**
 * Format a list of tags to be consume by Bower
 */
function releases(tags: string[], repository: string): ReleaseTags[] {
    if (!tags.length) {
        return [];
    }

    return tags.map((tag) => {
        return {
            target: `${repository}#${tag}`,
            version: tag
        };
    });
}

/**
 * Validates that the references have valid semver format
 */
function tags(refs: string[]): string[] {
    return refs.filter((el) => {
        return semver.valid(el);
    });
}

/**
 * Parse the server response in an array of consumable version strings
 */
function extractRefs(response: string): string[] {
    const versions = [];
    let data = {};

    try {
        data = JSON.parse(response);
    } catch (e) {
        throw e;
    }

    for (const pkg in data) {
        if (data.hasOwnProperty(pkg) && data[pkg].hasOwnProperty("Version_Text")) {
            versions.push(data[pkg].Version_Text);
        }
    }

    return versions;
}

/**
 * Class to communicate with ProGet
 */
class ProgetApi {
    /**
     * Test if the given source is in short format
     */
    public static isShortFormat(source: string): boolean {
        return (/.*\/.*/.test(source) === false) && (source.length > 0);
    }

    /**
     * Parse the server response into bower understandable format when asking for package available version(s)
     */
    public static extractReleases(response: string, repository: string): ReleaseTags[] {
        return releases(tags(extractRefs(response)), repository);
    }

    public fullUrlRegExp: RegExp = /(.*\/upack\/[\w.-]*)\/download\/[\w.-]*\/([\w.-]*)\/([\w.]*)/;
    private httpProxy: string;
    private proxy: string;
    private ca: Buffer;
    private strictSSL: boolean = true;
    private timeout: number;
    private defaultRequest: string;
    private cachedPackages: object;
    private logger: BowerLogger;
    private conf: ProGetApiConf[];
    private registries: string[] = [];
    private cache: ProGetCache = {};

    /**
     * Prepare for communicating with ProGet
     */
    constructor(bower: Bower) {
        this.httpProxy = bower.config.httpsProxy;
        this.proxy = bower.config.proxy;
        this.ca = bower.config.ca.search[0];
        this.strictSSL = bower.config.strictSsl;
        this.timeout = bower.config.timeout;
        this.defaultRequest = bower.config.request;
        this.cachedPackages = {};
        this.logger = bower.logger;

        // Validate the parameters in the configuration file and emit deprecation warnings
        this.checkForOldConfig(bower.config);

        // Parse the configuration in the retro-compatibility module
        RetroCompatibility.parse(bower.config);

        // Set config
        if (!bower.config.proget.hasOwnProperty("apiKeyMapping")) {
            throw createError(
                "Missing entries in the 'apiKeyMapping' parameter in 'proget' group of Bower configuration.",
                "EBOWERC"
            );
        } else {
            for (const mapping of bower.config.proget.apiKeyMapping) {
                // Add /upack/ at the end of the server address if not already there
                if (!/\/upack/.test(mapping.server)) {
                    mapping.server = `${mapping.server.replace(/\/$/, "")}/upack/`;
                }
                if (!mapping._serverRegExp) {
                    mapping._serverRegExp = new RegExp(mapping.server.replace(/\./g, "\\."));
                }
            }

            this.conf = bower.config.proget.apiKeyMapping;
        }

        // Set registries
        if (bower.config.registry.search.length === 0) {
            throw createError(
                "Missing entries in the 'registries' parameter in 'proget' group of Bower configuration.",
                "EBOWERC"
            );
        } else {
            for (const singleRegistry of bower.config.registry.search) {
                for (const cnf of this.conf) {
                    if (cnf._serverRegExp.test(singleRegistry)) {
                        this.registries.push(singleRegistry);
                    }
                }
            }
        }
    }

    /**
     * Throw warnings if old configuration parameters still in the .bowerrc file
     */
    public checkForOldConfig(conf: BowerConfig) {
        const warn = (parameter) => {
            this.logger.warn(
                "pubr - conf",
                `The parameter "${parameter}" is deprecated, may want to update your .bowerrc file.`
            );
        };

        if (conf.proget.hasOwnProperty("server")) {
            warn("proget.server");
        }

        if (conf.proget.hasOwnProperty("apiKey")) {
            warn("proget.apiKey");
        }

        if (conf.proget.hasOwnProperty("feed")) {
            warn("proget.feed");
        }

        if (conf.proget.hasOwnProperty("group")) {
            warn("proget.group");
        }

        if (conf.proget.hasOwnProperty("registries")) {
            warn("proget.registries");
        }
    }

    /**
     * Check if the source url has an API key in configuration
     */
    public isSupportedSource(source: string): boolean {
        // Check if formatted in our config style
        for (const conf of this.conf) {
            if (conf._serverRegExp.test(source)) {
                return true;
            }
        }

        return false;
    }

    /**
     * ProGet communication method
     */
    public communicate(url: string, adr: string, resolve: (data: string) => void, reject: (err: Error) => void,
                       params: RequestParameters, authentication?: boolean) {
        // TODO use retry here too
        let _request = request.defaults({
            ca: this.ca,
            proxy: Url.parse(url).protocol === "https:" ? this.httpProxy : this.proxy,
            qs: params,
            strictSSL: this.strictSSL,
            timeout: this.timeout
        });

        if (authentication) {
            const cred = Authentication.getInstance().getCredentialsByURI(url);

            if (cred) {
                _request.defaults({
                    auth: {
                        pass: cred.pass,
                        user: cred.user
                    }
                });
            } else {
                this.logger.error(
                    "pubr - auth",
                    `No authentication set in .npmrc for: ${Authentication.nerf(url)}`,
                    createError(`No authentication set in .npmrc for ${url}.`, "EAUTH")
                );
            }
        }

        _request = _request.defaults(this.defaultRequest || {});

        _request.post(adr, (error, response, body) => {
            const status = response.statusCode;

            if (error) {
                reject(createError(`Request to ${url} failed: ${error.message}`, error.code));
            } else {
                if (status === 200) {
                    resolve(body);
                } else if (status >= 300 && status < 400) {
                    this.communicate(url, response.headers.location.toString(), resolve, reject, params, authentication);
                } else if (status === 401) {
                    // To only answer one time to a authentication request
                    if (!authentication) {
                        this.communicate(url, response.headers.location.toString(), resolve, reject, params, true);
                    } else {
                        reject(createError(`Status multiple code of ${status} for ${url}`, "EHTTP", {
                            details: `${response}`
                        }));
                    }
                } else {
                    reject(createError(`Request to ${url} returned ${status} status code.`, "EREQUEST", {
                        details: `url: ${url}\nadr: ${adr}\n${JSON.stringify(response, null, 2)}`
                    }));
                }
            }
        });
    }

    /**
     * Communicate with ProGet to get a feed ID from a name
     */
    public findFeedId(url: string, resolve: (data: string) => void, reject: (err: Error) => void,
                      params: RequestParameters) {
        const reqID = `${url.split("/upack/")[0]}/api/json/Feeds_GetFeed`;

        this.communicate(url, reqID, resolve, reject, {Feed_Name: params.Feed_Id, API_Key: params.API_Key});
    }

    /**
     * Send request to ProGet
     */
    public sendRequest(source: string, pkg: string, apiMethod: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const rUrl = source.split("/upack/");
            const adr = `${rUrl[0]}/api/json/${apiMethod}`;

            const registry = this.conf.find((el) => {
                return el._serverRegExp.test(source);
            });

            if (registry) {
                // Prepare the request
                const params = {
                    API_Key: registry.key || "",
                    Feed_Id: rUrl[1],
                    Group_Name: "bower",
                    Package_Name: pkg
                };

                if (params.API_Key === "") {
                    reject(createError(
                        "Their is no 'apiKey' set on your system, please add one to you .bowerrc file. " +
                        "Seed documentation for HowTo.",
                        "EMISSAPIKEY")
                    );
                }

                // Test if we have the id or the feed name
                if (/^\d+$/.test(rUrl[1])) {
                    // If we have an ID
                    this.communicate(source, adr, resolve, reject, params);
                } else {
                    // If we have a name
                    this.findFeedId(source, (data) => {
                        if (data) {
                            params.Feed_Id = JSON.parse(data).Feed_Id;
                            this.communicate(source, adr, resolve, reject, params);
                        } else {
                            reject(createError(`Unable to found the Feed with the name ${params.Feed_Id}`, "EBOWERC"));
                        }
                    }, reject, params);
                }
            } else {
                resolve();
            }
        });
    }

    /**
     * Acquire information from ProGet about a Feed
     */
    public getFeedDetails(source: string): Promise<any> {
        return this.sendRequest(source, null, "Feeds_GetFeed").then(
            (detailsJson: string) => {
                if (detailsJson) {
                    const details = JSON.parse(detailsJson);
                    return {
                        description: details.Feed_Description,
                        id: details.Feed_Id,
                        name: details.Feed_Name,
                        type: details.FeedType_Name,
                    };
                } else {
                    return null;
                }
            }
        );
    }

    /**
     * Return the versions of a package from a source
     */
    public getPackageVersions(pkg: string): Promise<any> {
        if (ProgetApi.isShortFormat(pkg)) {
            // We will scan all the sources that match the regex.
            return new Promise((resolve: (data: ReleaseTags[]) => void, reject: (err: Error) => void) => {
                const promises = [];
                let out: ReleaseTags[] = [];

                for (const registry of this.registries) {
                    promises.push(this.sendRequest(registry, pkg, "ProGetPackages_GetPackageVersions")
                        .then((response: string) => {
                            out = out.concat(ProgetApi.extractReleases(response, registry));
                        })
                    );
                }

                Promise.all(promises).then(
                    () => {
                        resolve(out);
                    },
                    (err) => {
                        reject(err);
                    }
                );
            });
        } else if (this.fullUrlRegExp.test(pkg)) {
            // After match the only choice here is an already formatted ProGet Universal source
            return new Promise((resolve: (data: ReleaseTags[]) => void) => {
                const match = this.fullUrlRegExp.exec(pkg);

                if (match.length === 4) {
                    resolve([{
                        target: `${match[1]}#${match[3]}`,
                        version: match[3]
                    }]);
                } else {
                    this.logger.warn("pubr - match", `The url ${pkg} wasn't formatted correctly.`);
                    resolve([]);
                }
            });
        } else {
            return new Promise((resolve: (data: ReleaseTags[]) => void) => {
                resolve([]);
            });
        }
    }

    /**
     * Read the cache and return the available version(s) for the package
     */
    public readCache(pkg: string): ReleaseTags[] {
        return this.cache[pkg];
    }

    /**
     * Validate that the package can be treat by the resolver
     */
    public isMatching(pkg: string): Promise<any> {
        return new Promise((resolve: (data: boolean) => void, reject: (err: Error) => void) => {
            if (this.isSupportedSource(pkg) || ProgetApi.isShortFormat(pkg)) {
                this.getPackageVersions(pkg).then(
                    (data: ReleaseTags[]) => {
                        if (data.length > 0) {
                            this.cache[pkg] = data;

                            this.logger.debug(
                                "pubr - match", `The resolver pubr found ${data.length} versions of the package ${pkg}.`
                            );

                            resolve(true);
                        } else {
                            this.logger.debug(
                                "pubr - match", `The resolver pubr don't found the package ${pkg}.`
                            );

                            resolve(false);
                        }
                    },
                    (err) => {
                        reject(err);
                    }
                );
            } else {
                resolve(false);
            }
        });
    }
}

export default ProgetApi;
