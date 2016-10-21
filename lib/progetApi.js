"use strict";

/**
 * Proget communication module.
 * @module progetApi
 */

const createError = require("./createError");
const request = require("request");
const Url = require("url");
const semver = require("semver");
const Promise = require("bluebird");

/**
 * Format a list of tags to be consume by Bower
 *
 * @param {Array} tags - List of semver validated tags
 * @return {Array.<{release: string, target: string, version: string}>}
 */
function releases(tags) {
    if (!tags.length) {
        return [];
    }

    return tags.map((tag) => {
        return {
            release: tag,
            target: tag,
            version: tag
        };
    });
}

/**
 * Validates that the references have semver format
 *
 * @param {Array} refs - List of tags
 * @return {Array}
 */
function tags(refs) {
    return refs.filter((el) => {
        return semver.valid(el);
    });
}

/**
 * Parse the server response in an array of consumable version strings
 *
 * @param {string} response - The server response
 * @return {Array}
 */
function extractRefs(response) {
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
     * Prepare for communicating with ProGet
     *
     * @param {bowerObj} bower
     */
    constructor(bower) {
        this.httpProxy = bower.config.httpsProxy;
        this.proxy = bower.config.proxy;
        this.ca = bower.config.ca.search[0];
        this.strictSSL = bower.config.strictSsl;
        this.timeout = bower.config.timeout;
        this.defaultRequest = bower.config.request;
        this.cachedPackages = {};
        this.logger = bower.logger;

        if (!bower.config.hasOwnProperty("proget")) {
            throw createError("Missing parameter 'proget' in Bower configuration.", "EBOWERC");
        }

        if (!bower.config.proget.hasOwnProperty("registries")) {
            throw createError("Missing entries in the 'registries' parameter in 'proget' group of Bower configuration.", "EBOWERC");
        }

        this.registries = bower.config.proget.registries.map((value) => {
            let split = value.split("/upack/");
            return {
                server: split[0],
                feed: split[1]
            };
        });

        if (this.registries.length > 0) {
            if (!bower.config.proget.hasOwnProperty("apiKeyMapping")) {
                throw createError("Missing parameter 'apiKeyMapping' in 'proget' group of Bower configuration.", "EBOWERC");
            }

            this.registries.forEach((registry) => {
                let apiEntry = bower.config.proget.apiKeyMapping.find((api) => {
                    return api.server.trim() == registry.server.trim();
                });

                if (apiEntry === undefined || !apiEntry.hasOwnProperty("key")) {
                    throw createError(`Missing apikey in 'proget.apiKeyMapping' for '${registry.server}' in .bowerrc file.`, "EBOWERC");
                }

                registry.apiKey = apiEntry.key;
            });
        }
    }

    /**
     * Generate the possible ProGet URL
     *
     * @param {string} packageName - The name of the package to search
     * @returns {string}
     */
    generatePossibleUrl(packageName) {
        return this.registries.map((registry) => {
            return `${registry.server}?${registry.feed}/bower/${packageName}`;
        });
    }

    /**
     * ProGet communication method
     *
     * @param {string} url - The URL to connect to
     * @param {string} adr - The address to access
     * @param {function} resolve - Promise success function
     * @param {function} reject - Promise fail function
     * @param {{}} params - Parameters use in the query
     */
    communicate(url, adr, resolve, reject, params) {
        let _request = request.defaults({
            proxy: Url.parse(url).protocol === "https:" ? this.httpProxy : this.proxy,
            ca: this.ca,
            strictSSL: this.strictSSL,
            timeout: this.timeout,
            qs: params
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
                        details: response.toString()
                    }));
                }
            }
        });
    }

    /**
     * Communicate with ProGet to get a feed ID from a name
     *
     * @param {string} url - The URL to connect to
     * @param {function} resolve - The success function
     * @param {function} reject - The reject function
     * @param {{}} params - Parameters use in the query
     */
    findFeedId(url, resolve, reject, params) {
        let reqID = url.split("?")[0] + "/api/json/Feeds_GetFeed";

        this.communicate(url, reqID, resolve, reject, {Feed_Name: params.Feed_Id, API_Key: params.API_Key});
    }

    /**
     * Convert URL to alpha-numeric format
     *
     * @param {string} url - The URL to connect to
     * @returns {string}
     */
    static urlToKey(url) {
        return url.replace(/[^a-zA-Z0-9:]/g, "");
    }

    /**
     * Send request to ProGet
     *
     * @param {string} source - The URL to connect to
     * @param {string} apiMethod - The ProGet API method to use
     */
    sendRequest(source, apiMethod) {
        return new Promise((resolve, reject) => {
            let rUrl = source.split("?");
            let adr = rUrl[0] + "/api/json/" + apiMethod;
            let rParams = rUrl[1].split("/");

            let registry = this.registries.find((registry) => {
                return ProgetApi.urlToKey(registry.server) == ProgetApi.urlToKey(rUrl[0]);
            });
            // Prepare the request
            let params = {
                API_Key: registry.apiKey || "",
                Feed_Id: rParams[0],
                Group_Name: rParams[1] || "bower",
                Package_Name: rParams[2]
            };

            if (params.API_Key === "") {
                reject(createError("Their is no 'apiKey' set on your system, please add one to you .bowerrc file. Seed documentation for HowTo.", "EMISSAPIKEY"));
            }

            // Test if we have the id or the feed name
            if (/^\d+$/.test(rParams[0])) {
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
        });
    }

    /**
     * Acquire information from ProGet about a Feed
     *
     * @param {string} source - The URL to connect to
     * @returns {Promise}
     */
    getFeedDetails(source) {
        return this.sendRequest(source, "Feeds_GetFeed").then((detailsJson) => {
            let details = JSON.parse(detailsJson);
            return {
                name: details.Feed_Name,
                description: details.Feed_Description,
                id: details.Feed_Id,
                type: details.FeedType_Name,
            };
        });
    }

    /**
     * Tell if this tool can support the package
     *
     * @param {string} packageName - The name of the package
     * @returns {boolean}
     */
    supportsPackage(packageName) {
        return this.cachedPackages.hasOwnProperty(packageName);
    }

    /**
     * Check if the source url has an API key in configuration
     *
     * @param {string} source - The URL to connect to
     * @returns {boolean}
     */
    isSupportedServer(source) {
        return this.registries.some((registry) => {
            return ProgetApi.urlToKey(source).indexOf(ProgetApi.urlToKey(`${registry.server}/?${registry.feed}`)) > -1;
        });
    }

    /**
     * Set the default source to download from
     * The first source containing a package is use as default
     *
     * @param {string} packageName - The name of the package
     * @returns {string}
     */
    locatePackage(packageName) {
        return this.cachedPackages[packageName].defaultSource;
    }

    /**
     * Locally hold the map between packages names and their feed by version
     *
     * @param {string} packageName - The name of the package
     * @returns {Promise}
     */
    fillCache(packageName) {
        return Promise.mapSeries(
            this.generatePossibleUrl(packageName)
                .map((url) => {
                    return this.getPackagesSingle(url).then(
                        (sourcePackages) => {
                            if (sourcePackages.length > 0) {
                                if (this.cachedPackages[packageName] === undefined) {
                                    this.cachedPackages[packageName] = {};
                                }

                                let formattedUrl = url.replace("?", "/?");

                                this.cachedPackages[packageName][formattedUrl] = sourcePackages;

                                return formattedUrl;
                            }
                            return null;
                        }
                    );
                }),
            (validSource) => {
                if (this.cachedPackages[packageName] !== undefined && this.cachedPackages[packageName].defaultSource == null && validSource != null) {
                    this.cachedPackages[packageName].defaultSource = validSource;
                }
            }
        );
    }

    /**
     * From a url, return the list of packages
     *
     * @param {string} url - The URL to connect to
     * @returns {Promise}
     */
    getPackagesSingle(url) {
        return this.sendRequest(url, "ProGetPackages_GetPackages").then(
            (response) => {
                try {
                    return JSON.parse(response);
                } catch (e) {
                    this.logger.error("EPARSED", "Unable to parse Proget GetPackage response", response);
                    return [];
                }
            },
            () => {
                return [];
            }
        );
    }

    /**
     * Return the versions of a package from a source
     *
     * @param {string} source - The URL to connect to
     * @returns {Promise}
     */
    getPackageVersions(source) {
        return this.sendRequest(source, "ProGetPackages_GetPackageVersions").then((response) => {
            return ProgetApi.extractReleases(response);
        });
    }

    /**
     * Parse the server response into bower understandable format when asking for package available version(s)
     *
     * @param {string} response - The server response
     * @return {Array.<{release: string, target: string, version: string}>}
     */
    static extractReleases(response) {
        return releases(tags(extractRefs(response)));
    }
}

module.exports = ProgetApi;
