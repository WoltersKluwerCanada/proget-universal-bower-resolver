"use strict";
/* tslint:disable:object-literal-sort-keys */
import * as rimraf from "rimraf";
import * as tmp from "tmp";
import download from "./download";
import extract from "./extract";
import ProgetAPI from "./progetApi";

// Prepare the temp module
tmp.setGracefulCleanup();

/**
 * Main module section
 */
const resolver = (bower: Bower) => {
    const api = ProgetAPI.getInstance();

    if (!api.isInitialise) {
        api.ini(bower);
    }

    return {
        /**
         * Tells Bower whether to use or not use this resolver for some source.
         */
        match: (source: string): Promise<any> => {
            return api.isMatching(source);
        },

        /**
         * Bower selects one matching version from the result and passes matching target field to fetch method.
         */
        releases: (source: string): ReleaseTags[] => {
            return api.readCache(source);
        },

        /**
         * Downloads given endpoint and returns path to temporary directory
         */
        fetch: (endpoint: BowerPackageEndpoint, cached: BowerPackageCached) => {
            // TODO Bring back this line once Node 6 is the oldest supported Node version
            // let [src, version] = endpoint.target.split("#");
            const part = endpoint.target.split("#");
            const src = part[0];
            const version = part[1];

            if (cached.version !== version) {
                // Url ex: http://<yourProget.com>/upack/<universal-feed-name>/download/bower/<packageName>/<0.0.0>
                let downloadUrl: string;

                if (api.fullUrlRegExp.test(endpoint.source)) {
                    downloadUrl = endpoint.source;
                } else {
                    downloadUrl = `${src}/download/bower/${endpoint.source}/${version}`;
                }

                const downloadPath = tmp.dirSync({unsafeCleanup: true, prefix: `pubr-${endpoint.source}`});

                return download(downloadUrl, downloadPath.name, bower).then((archivePatch) => {
                    const extractPath = tmp.dirSync({unsafeCleanup: true, prefix: `pubr-${version}_${endpoint.name}_`});

                    return extract(archivePatch, extractPath.name, bower.logger).then(() => {
                        process.on("exit", () => {
                            rimraf(downloadPath.name, () => {
                                rimraf(extractPath.name, () => {
                                    try {
                                        downloadPath.removeCallback();
                                    }
                                    catch (e) {
                                        // This error can be ignored
                                    } finally {
                                        try {
                                            extractPath.removeCallback();
                                        }
                                        catch (e) {
                                            // This error can be ignored
                                        }
                                    }
                                });
                            });
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

export default resolver;
