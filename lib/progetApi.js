"use strict";
const request = require("request");
const semver = require("semver");
const Url = require("url");
const createError_1 = require("./createError");
function releases(tags, repository) {
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
function tags(refs) {
    return refs.filter((el) => {
        return semver.valid(el);
    });
}
function extractRefs(response) {
    let versions = [];
    let data = {};
    try {
        data = JSON.parse(response);
    }
    catch (e) {
        throw e;
    }
    for (let pkg in data) {
        if (data.hasOwnProperty(pkg) && data[pkg].hasOwnProperty("Version_Text")) {
            versions.push(data[pkg].Version_Text);
        }
    }
    return versions;
}
class ProgetApi {
    constructor(bower) {
        this.fullUrlRegExp = /(.*\/upack\/[\w.-]*)\/download\/[\w.-]*\/([\w.-]*)\/([\w.]*)/;
        this.strictSSL = true;
        this.registries = [];
        this.cache = {};
        this.httpProxy = bower.config.httpsProxy;
        this.proxy = bower.config.proxy;
        this.ca = bower.config.ca.search[0];
        this.strictSSL = bower.config.strictSsl;
        this.timeout = bower.config.timeout;
        this.defaultRequest = bower.config.request;
        this.cachedPackages = {};
        this.logger = bower.logger;
        if (!bower.config.proget.hasOwnProperty("apiKeyMapping")) {
            throw createError_1.default("Missing entries in the 'apiKeyMapping' parameter in 'proget' group of Bower configuration.", "EBOWERC");
        }
        else {
            for (let i = 0, j = bower.config.proget.apiKeyMapping.length; i < j; ++i) {
                let mapping = bower.config.proget.apiKeyMapping[i];
                if (!ProgetApi.validateRegexScope(mapping.server.toString())) {
                    this.logger.warn("proget-universal-bower-resolver", `The regex ${mapping.server} may allow other feed type then ProGet Universal ones.` +
                        `Please validate that your regex contain "upack" in it.`);
                }
                mapping.server = new RegExp(mapping.server);
            }
            this.conf = bower.config.proget.apiKeyMapping;
        }
        if (bower.config.registry.search.length === 0) {
            throw createError_1.default("Missing entries in the 'registries' parameter in 'proget' group of Bower configuration.", "EBOWERC");
        }
        else {
            for (let i = 0, j = bower.config.registry.search.length; i < j; i++) {
                for (let k = 0, l = this.conf.length; k < l; ++k) {
                    if (this.conf[k].server.test(bower.config.registry.search[i])) {
                        this.registries.push(bower.config.registry.search[i]);
                    }
                }
            }
        }
        this.checkForOldConfig(bower.config);
    }
    static isShortFormat(source) {
        return (/.*\/.*/.test(source) === false) && (source.length > 0);
    }
    static validateRegexScope(regex) {
        return /upack/.test(regex);
    }
    static extractReleases(response, repository) {
        return releases(tags(extractRefs(response)), repository);
    }
    checkForOldConfig(conf) {
        let warn = (parameter) => {
            this.logger.warn("pubr - conf", `The parameter "${parameter}" is no more require, you can delete it from your your .bowerrc file.`);
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
    isSupportedSource(source) {
        for (let i = 0, j = this.conf.length; i < j; ++i) {
            if (this.conf[i].server.test(source)) {
                return true;
            }
        }
        return false;
    }
    communicate(url, adr, resolve, reject, params) {
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
                reject(createError_1.default(`Request to ${url} failed: ${error.message}`, error.code));
            }
            else {
                if (response.statusCode === 200) {
                    resolve(body);
                }
                else {
                    reject(createError_1.default(`Request to ${url} returned ${response.statusCode} status code.`, "EREQUEST", {
                        details: `url: ${url}\nadr: ${adr}\n${JSON.stringify(response, null, 2)}`
                    }));
                }
            }
        });
    }
    findFeedId(url, resolve, reject, params) {
        let reqID = `${url.split("/upack/")[0]}/api/json/Feeds_GetFeed`;
        this.communicate(url, reqID, resolve, reject, { Feed_Name: params.Feed_Id, API_Key: params.API_Key });
    }
    sendRequest(source, pkg, apiMethod) {
        return new Promise((resolve, reject) => {
            let rUrl = source.split("/upack/");
            let adr = `${rUrl[0]}/api/json/${apiMethod}`;
            let registry = this.conf.find((el) => {
                return el.server.test(source);
            });
            if (registry) {
                let params = {
                    API_Key: registry.key || "",
                    Feed_Id: rUrl[1],
                    Group_Name: "bower",
                    Package_Name: pkg
                };
                if (params.API_Key === "") {
                    reject(createError_1.default("Their is no 'apiKey' set on your system, please add one to you .bowerrc file. " +
                        "Seed documentation for HowTo.", "EMISSAPIKEY"));
                }
                if (/^\d+$/.test(rUrl[1])) {
                    this.communicate(source, adr, resolve, reject, params);
                }
                else {
                    this.findFeedId(source, (data) => {
                        if (data) {
                            params.Feed_Id = JSON.parse(data).Feed_Id;
                            this.communicate(source, adr, resolve, reject, params);
                        }
                        else {
                            reject(createError_1.default(`Unable to found the Feed with the name ${params.Feed_Id}`, "EBOWERC"));
                        }
                    }, reject, params);
                }
            }
            else {
                resolve();
            }
        });
    }
    getFeedDetails(source) {
        return this.sendRequest(source, null, "Feeds_GetFeed").then((detailsJson) => {
            if (detailsJson) {
                let details = JSON.parse(detailsJson);
                return {
                    description: details.Feed_Description,
                    id: details.Feed_Id,
                    name: details.Feed_Name,
                    type: details.FeedType_Name,
                };
            }
            else {
                return null;
            }
        });
    }
    getPackageVersions(pkg) {
        if (ProgetApi.isShortFormat(pkg)) {
            return new Promise((resolve, reject) => {
                let promises = [];
                let out = [];
                for (let i = 0, j = this.registries.length; i < j; ++i) {
                    promises.push(this.sendRequest(this.registries[i], pkg, "ProGetPackages_GetPackageVersions")
                        .then((response) => {
                        out = out.concat(ProgetApi.extractReleases(response, this.registries[i]));
                    }));
                }
                Promise.all(promises).then(() => {
                    resolve(out);
                }, (err) => {
                    reject(err);
                });
            });
        }
        else if (this.fullUrlRegExp.test(pkg)) {
            return new Promise((resolve) => {
                const match = this.fullUrlRegExp.exec(pkg);
                if (match.length === 4) {
                    resolve([{
                            target: `${match[1]}#${match[3]}`,
                            version: match[3]
                        }]);
                }
                else {
                    this.logger.warn("pubr - match", `The url ${pkg} wasn't formatted correctly.`);
                    resolve([]);
                }
            });
        }
        else {
            return new Promise((resolve) => {
                resolve([]);
            });
        }
    }
    readCache(pkg) {
        return this.cache[pkg];
    }
    isMatching(pkg) {
        return new Promise((resolve, reject) => {
            if (this.isSupportedSource(pkg) || ProgetApi.isShortFormat(pkg)) {
                this.getPackageVersions(pkg).then((data) => {
                    if (data.length > 0) {
                        this.cache[pkg] = data;
                        this.logger.debug("pubr - match", `The resolver pubr found ${data.length} versions of the package ${pkg}.`);
                        resolve(true);
                    }
                    else {
                        this.logger.debug("pubr - match", `The resolver pubr don't found the package ${pkg}.`);
                        resolve(false);
                    }
                }, (err) => {
                    reject(err);
                });
            }
            else {
                resolve(false);
            }
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProgetApi;
