"use strict";
/**
 * Proget communication module.
 * @module progetApi
 */
import * as request from "request";
import * as semver from "semver";
import * as Url from "url";
import createError from "./createError";

/**
 * Format a list of tags to be consume by Bower
 *
 * @param {string[]} tags - List of semver validated tags
 * @param {string} repository - The source from where theses tags were found
 * @return {ReleaseTags[]}
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
 *
 * @param {string[]} refs - List of tags
 * @return {string[]}
 */
function tags(refs: string[]): string[] {
    return refs.filter((el) => {
        return semver.valid(el);
    });
}

/**
 * Parse the server response in an array of consumable version strings
 *
 * @param {string} response - The server response
 * @return {string[]}
 */
function extractRefs(response: string): string[] {
    let versions = [];
    let data = {};

    try {
        data = JSON.parse(response);
    } catch (e) {
        throw e;
    }

    for (let pkg in data) {
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
     *
     * @param {string} source - The source to analyse
     * @returns {boolean}
     */
    public static isShortFormat(source: string): boolean {
        return (/.*\/.*/.test(source) === false) && (source.length > 0);
    }

    /**
     * Parse the server response into bower understandable format when asking for package available version(s)
     *
     * @param {string} response - The server response
     * @param {string} repository - The address from where the response was received
     * @return {ReleaseTags[]}
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
    private cachedPackages: Object;
    private logger: BowerLogger;
    private conf: ProGetApiConf[];
    private registries: string[] = [];
    private cache: ProGetCache = {};

    /**
     * Prepare for communicating with ProGet
     *
     * @param {Bower} bower
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

        // Set config
        if (!bower.config.proget.hasOwnProperty("apiKeyMapping")) {
            throw createError(
                "Missing entries in the 'apiKeyMapping' parameter in 'proget' group of Bower configuration.",
                "EBOWERC"
            );
        } else {
            for (let i = 0, j = bower.config.proget.apiKeyMapping.length; i < j; ++i) {
                let mapping = bower.config.proget.apiKeyMapping[i];

                // Add /upack/ at the end of the server address if not already there
                if (!/\/upack\//.test(mapping.server)) {
                    mapping.server = `${mapping.server.replace(/\/$/, "")}/upack/`;
                }
                mapping._serverRegExp = new RegExp(mapping.server.replace("/", "\/").replace(".", "\."));
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
            for (let i = 0, j = bower.config.registry.search.length; i < j; i++) {
                for (let k = 0, l = this.conf.length; k < l; ++k) {
                    if (this.conf[k]._serverRegExp.test(bower.config.registry.search[i])) {
                        this.registries.push(bower.config.registry.search[i]);
                    }
                }
            }
        }

        // Validate the parameters in the configuration file
        this.checkForOldConfig(bower.config);
    }

    /**
     * Throw warnings if old configuration parameters still in the .bowerrc file
     *
     * @param {BowerConfig} conf - The Bower configuration
     */
    public checkForOldConfig(conf: BowerConfig) {
        let warn = (parameter) => {
            this.logger.warn(
                "pubr - conf",
                `The parameter "${parameter}" is no more require, you can delete it from your your .bowerrc file.`
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
    }

    /**
     * Check if the source url has an API key in configuration
     *
     * @param {string} source - The URL to connect to
     * @returns {boolean}
     */
    public isSupportedSource(source: string): boolean {
        // Check if formatted in our config style
        for (let i = 0, j = this.conf.length; i < j; ++i) {
            if (this.conf[i]._serverRegExp.test(source)) {
                return true;
            }
        }

        return false;
    }

    /**
     * ProGet communication method
     *
     * @param {string} url - The URL to connect to
     * @param {string} adr - The address to access
     * @param {Function} resolve - Promise success function
     * @param {Function} reject - Promise fail function
     * @param {RequestParameters} params - Parameters use in the query
     */
    public communicate(url: string, adr: string, resolve: Function, reject: Function, params: RequestParameters) {
        let _request = request.defaults({
            ca: this.ca,
            proxy: Url.parse(url).protocol === "https:" ? this.httpProxy : this.proxy,
            qs: params,
            strictSSL: this.strictSSL,
            timeout: this.timeout
        });

        _request = _request.defaults(this.defaultRequest || {});

        _request(adr, (error, response, body) => {
            if (error) {
                reject(createError(`Request to ${url} failed: ${error.message}`, error.code));
            } else {
                if (response.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(createError(`Request to ${url} returned ${response.statusCode} status code.`, "EREQUEST", {
                        details: `url: ${url}\nadr: ${adr}\n${JSON.stringify(response, null, 2)}`
                    }));
                }
            }
        });
    }

    /**
     * Communicate with ProGet to get a feed ID from a name
     *
     * @param {string} url - The URL to connect to
     * @param {Function} resolve - The success function
     * @param {Function} reject - The reject function
     * @param {RequestParameters} params - Parameters use in the query
     */
    public findFeedId(url: string, resolve: Function, reject: Function, params: RequestParameters) {
        let reqID = `${url.split("/upack/")[0]}/api/json/Feeds_GetFeed`;

        this.communicate(url, reqID, resolve, reject, {Feed_Name: params.Feed_Id, API_Key: params.API_Key});
    }

    /**
     * Send request to ProGet
     *
     * @param {string} source - The URL to connect to
     * @param {string} pkg - The package
     * @param {string} apiMethod - The ProGet API method to use
     * @returns {Promise}
     */
    public sendRequest(source: string, pkg: string, apiMethod: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let rUrl = source.split("/upack/");
            let adr = `${rUrl[0]}/api/json/${apiMethod}`;

            let registry = this.conf.find((el) => {
                return el._serverRegExp.test(source);
            });

            if (registry) {
                // Prepare the request
                let params = {
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
     *
     * @param {string} source - The URL to connect to
     * @returns {Promise}
     */
    public getFeedDetails(source: string): Promise<any> {
        return this.sendRequest(source, null, "Feeds_GetFeed").then(
            (detailsJson: string) => {
                if (detailsJson) {
                    let details = JSON.parse(detailsJson);
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
     *
     * @param {string} pkg - Tha package to list the versions
     * @returns {Promise}
     */
    public getPackageVersions(pkg: string): Promise<any> {
        if (ProgetApi.isShortFormat(pkg)) {
            // We will scan all the sources that match the regex.
            return new Promise((resolve: Function, reject: Function) => {
                let promises = [];
                let out: ReleaseTags[] = [];

                for (let i = 0, j = this.registries.length; i < j; ++i) {
                    promises.push(this.sendRequest(this.registries[i], pkg, "ProGetPackages_GetPackageVersions")
                        .then((response: string) => {
                            out = out.concat(ProgetApi.extractReleases(response, this.registries[i]));
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
            return new Promise((resolve: Function) => {
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
            return new Promise((resolve: Function) => {
                resolve([]);
            });
        }
    }

    /**
     * Read the cache and return the available version(s) for the package
     *
     * @param {string} pkg - The package
     * @returns {ReleaseTags[]}
     */
    public readCache(pkg: string): ReleaseTags[] {
        return this.cache[pkg];
    }

    /**
     * Validate that the package can be treat by the resolver
     *
     * @param {string} pkg - The package to found
     * @returns {Promise}
     */
    public isMatching(pkg: string): Promise<any> {
        return new Promise((resolve: Function, reject: Function) => {
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
