"use strict";

/**
 * Main module.
 * @module index
 */

// Prepare the temp module
const tmp = require("tmp");
tmp.setGracefulCleanup();

const download = require("./download");
const extract = require("./extract");
const progetAPI = require("../lib/progetApi");

/**
 * Test the format of the source URL
 *
 * @param {String} source - The URL to validate
 * @returns {boolean}
 */
function isSourceUrl(source){
    return /^(https?|ssh|git):\/\/.*/.test(source);
}

/**
 * Main module section
 *
 * @param {{logger: {}, version: string, config: {proget: {group: string, apiKey: string, feedId: number}}}} bower
 * @return {*}
 */
module.exports = function resolver(bower) {
    let api = new progetAPI(bower.config);

    return {
        /**
         * Tells Bower whether to use or not use this resolver for some source.
         *
         * @returns {boolean|Promise} - Tells whether resolver can handle given source
         */
        match: function(source) {
            if(isSourceUrl(source)){
                return api.isSupportedServer(source);
            } else {
                // Is the short form and need to be validated against the feed packages
                return api.fillCache(source)
                    .then(function(){
                        return api.supportsPackage(source);
                    });
            }
        },

        /**
         * Allows to implement simplified registry
         *
         * @param {string} source - Source from bower.json
         * @returns {string} - Resolved source string
         */
        locate(source) {
            if (/^https?:\/\/.*/.test(source) || source.indexOf("?") != -1) {
                return source;
            } else {
                return api.locatePackage(source);
            }
        },

        /**
         * Bower selects one matching version from the result and passes matching target field to fetch method.
         *
         * @param {string} source - Source from bower.json
         * @returns {Promise}
         */
        releases(source) {
            return api.getPackageVersions(source);
        },

        /**
         * Downloads given endpoint and returns path to temporary directory
         *
         * @param {{name: string, source: string, target: string}} endpoint - Endpoint for the resource to download
         * @param {{}} cached  - Contains information about cached resource
         * @param {endpoint} cached.endpoint - Endpoint of cached resource
         * @param {string} cached.release - The must plausible cache version
         * @param {Array} [cached.releases] - The version available in cache
         * @param {string} cached.version - Present cached resource has been resolved as version
         * @param {string|{}} cached.resolution - The “resolution” returned from previous fetch call for same resource
         * @returns {Promise}
         */
        fetch(endpoint, cached) {
            if (cached.version !== endpoint.target) {
                return api.getFeedDetails(endpoint.source).then((feedDetails) => {
                    let adrInfo = endpoint.source.split("?");
                    let params = adrInfo[1].split("/");

                    // Url ex: http://<yourProget.com>/upack/<universal-feed-name>/download/bower/<packageName>/<0.0.0>
                    let downloadUrl = `${adrInfo[0]}/upack/${feedDetails.name}/download/bower/${params[2]}/${endpoint.target}`;
                    let downloadPath = tmp.dirSync({unsafeCleanup: true});

                    return download(downloadUrl, downloadPath.name, bower.config).then((archivePatch) => {
                        let extractPath = tmp.dirSync({unsafeCleanup: true});

                        return extract(archivePatch, extractPath.name).then(() => {
                            downloadPath.removeCallback();

                            process.on("exit", ()=> {
                                try {
                                    extractPath.removeCallback();
                                }
                                catch(e){
                                    // This error can be ignored
                                }
                            });

                            return {
                                tempPath: extractPath.name,
                                removeIgnores: true
                            };
                        });
                    });
                });
            }
        }
    };
};
