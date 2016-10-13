"use strict";

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
    let versions = [],
        data = {};

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

class ProgetApi{
    constructor(config){
        this.httpProxy = config.httpsProxy;
        this.proxy = config.proxy;
        this.ca = config.ca.search[0];
        this.strictSSL = config.strictSsl;
        this.timeout = config.timeout;
        this.defaultRequest = config.request;

        if (!config.hasOwnProperty("proget")) {
            throw createError("Missing parameter 'proget' in Bower configuration.", "EBOWERC");
        }

        if(!config.proget.hasOwnProperty("registries")){
            throw createError("Missing entries in the 'registries' parameter in 'proget' group of Bower configuration.", "EBOWERC");
        }

        this.registries = config.proget.registries.map(function(value){
            let split = value.split("/upack/");
            return {
                server : split[0],
                feed : split[1]
            };
        });

        if(this.registries.length > 0){
            if(!config.proget.hasOwnProperty("apiKeyMapping")){
                throw createError("Missing parameter 'apiKeyMapping' in 'proget' group of Bower configuration.", "EBOWERC");
            }

            this.registries.forEach(function(registry){
                registry.apiKey = config.proget.apiKeyMapping[registry.server];

                if(registry.apiKey === undefined)
                    throw createError(`Missing apikey in 'proget.apiKeyMapping' for '${registry.server}' in .bowerrc file.`, "EBOWERC");
            });
        }
    }

    generatePossibleUrl(packageName){
        return this.registries.map(function(registry){
            return `${registry.server}?${registry.feed}/bower/${packageName}`;
        });
    }

    communicate(url, adr, resolve, reject, params){
        let _request = request.defaults({
            proxy: Url.parse(url).protocol === "https:" ? this.httpProxy : this.proxy,
            ca: this.ca,
            strictSSL: this.strictSSL,
            timeout: this.timeout,
            qs: params
        });

        _request = _request.defaults(this.defaultRequest || {});

        _request(adr, function(error, response, body) {
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

    findFeedId(url, reject, params, callback) {
        let reqID = url.split("?")[0] + "/api/json/Feeds_GetFeed";

        this.communicate(url, reqID, callback, reject, {Feed_Name: params.Feed_Id, API_Key: params.API_Key});
    }

    sendRequest (source, apiMethod) {
        return new Promise((resolve, reject) => {
            let rUrl = source.split("?");
            let adr = rUrl[0] + "/api/json/" + apiMethod;
            let rParams = rUrl[1].split("/");

            let registry = this.registries.find(function(registry){return registry.server == rUrl[0]});
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
                this.findFeedId(source, reject, params, (data) => {
                    if (data) {
                        params.Feed_Id = JSON.parse(data).Feed_Id;
                        this.communicate(source, adr, resolve, reject, params);
                    } else {
                        reject(createError(`Unable to found the Feed with the name ${params.Feed_Id}`, "EBOWERC"));
                    }
                });
            }
        });
    }
    
    getFeedDetails(source) {
        return this.sendRequest(source, "Feeds_GetFeed").then((detailsJson) => {
            let details = JSON.parse(detailsJson);
            return {
                name : details.Feed_Name,
                description : details.Feed_Description,
                id : details.Feed_Id,
                type : details.FeedType_Name,
            };
        });
    }
    
    supportsPackage(packageName){
        return this.getPackagesAll(packageName)
            .then(function(packages){
                return packages.length > 0;
            });
    }

    isSuportedServer(source){
        return this.registries.some(function(registry){
            return source.indexOf(`${registry.server}/${registry.feed}`) > -1;
        });
    }

    locatePackage(packageName){
        let source = null;
        let api = this;

        return Promise.mapSeries(
            api.generatePossibleUrl(packageName)
                .map(function(url){
                    return api.getPackagesSingle(url).then(function (sourcePackages) {
                        if(sourcePackages.length > 0)
                            return url;
                        return null;
                    });
                }),
            function(validSource){
                if(source == null && validSource != null)
                    source = validSource;
            })
            .then(function(){
                return source;
            });
    }

    getPackagesAll(packageName) {
        let api = this;

        return Promise.reduce(
                api.generatePossibleUrl(packageName),
                function(acc, current){
                    return api.getPackagesSingle(current).then(function(packages){
                        return acc.concat(packages);
                    });
                },[]).then(function(allPackages){
                    allPackages = allPackages.sort(function(a, b){
                        //Todo better comparison
                        return a.Version_Text > b.Version_Text;
                    }).filter(function(el, i, a){
                        return i == a.findIndex(function(value) { return value.Version_Text == el.Version_Text; });
                    });

                    return allPackages;
                });
    }
/*
    getPackagesAllVersion(packageName) {
        let api = this;

        return Promise.reduce(
            api.generatePossibleUrl(packageName),
            function(acc, current){
                return api.getPackageVersions(current).then(function(packages){
                    return acc.concat(packages);
                });
            },[]).then(function(allPackages){
            allPackages = allPackages.sort(function(a, b){
                //Todo better comparison
                return a.version > b.version;
            }).filter(function(el, i, a){
                return i == a.findIndex(function(value) { return value.version == el.version; });
            });

            return allPackages;
        });
    }
*/
    getPackagesSingle(url) {
        return this.sendRequest(url, "ProGetPackages_GetPackages").then(
            (response) => {
                try {
                    return JSON.parse(response);
                } catch (e) {
                    console.error("Unable to parse Proget GetPackage response");
                    return [];
                }
            },
            (error) => {
                return [];
            }
        );
    }

    getPackageVersions(source) {
        return this.sendRequest(source, "ProGetPackages_GetPackageVersions").then((response) => {
            return this.extractReleases(response);
        });
    }

    /**
     * Call the server response parsing
     *
     * @param {string} response - The server response
     * @return {Array.<{release: string, target: string, version: string}>}
     */
    extractReleases(response) {
        return releases(tags(extractRefs(response)));
    }
}

module.exports = {
    createApi: function (config) {
        return new ProgetApi(config);
    }
};
