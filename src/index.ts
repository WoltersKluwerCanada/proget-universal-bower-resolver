"use strict";

/**
 * Main module.
 * @module index
 */

/* tslint:disable:object-literal-sort-keys */

// Prepare the temp module
import * as tmp from "tmp";
tmp.setGracefulCleanup();

import download from "./download";
import extract from "./extract";
import ProgetAPI from "./progetApi";

/**
 * Main module section
 *
 * @param {Bower} bower
 * @return {{match: Function, releases: Function, fetch: Function}}
 */
const resolver = (bower: Bower) => {
    let api = new ProgetAPI(bower);

    return {
        /**
         * Tells Bower whether to use or not use this resolver for some source.
         *
         * @param {string} source - Source from bower.json
         * @returns {Promise} - Tells whether resolver can handle given source
         */
        match: (source: string): Promise<any> => {
            return api.isMatching(source);
        },

        /**
         * Bower selects one matching version from the result and passes matching target field to fetch method.
         *
         * @param {string} source - Source from bower.json
         * @returns {ReleaseTags[]}
         */
        releases: (source: string): ReleaseTags[] => {
            return api.readCache(source);
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
        fetch: (endpoint, cached) => {
            let [src, version] = endpoint.target.split("#");

            if (cached.version !== version) {
                // Url ex: http://<yourProget.com>/upack/<universal-feed-name>/download/bower/<packageName>/<0.0.0>
                let downloadUrl = `${src}/download/bower/${endpoint.source}/${version}`;
                let downloadPath = tmp.dirSync({unsafeCleanup: true});

                return download(downloadUrl, downloadPath.name, bower.config).then((archivePatch) => {
                    let extractPath = tmp.dirSync({unsafeCleanup: true});

                    return extract(archivePatch, extractPath.name).then(() => {
                        downloadPath.removeCallback();

                        process.on("exit", () => {
                            try {
                                extractPath.removeCallback();
                            }
                            catch (e) {
                                // This error can be ignored
                            }
                        });

                        return {
                            removeIgnores: true,
                            tempPath: extractPath.name
                        };
                    });
                });
            }
        }
    };
};

module.exports = resolver;
