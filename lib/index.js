"use strict";
const tmp = require("tmp");
const download_1 = require("./download");
const extract_1 = require("./extract");
const progetApi_1 = require("./progetApi");
tmp.setGracefulCleanup();
const resolver = (bower) => {
    let api = new progetApi_1.default(bower);
    return {
        match: (source) => {
            return api.isMatching(source);
        },
        releases: (source) => {
            return api.readCache(source);
        },
        fetch: (endpoint, cached) => {
            let [src, version] = endpoint.target.split("#");
            if (cached.version !== version) {
                let downloadUrl;
                if (api.fullUrlRegExp.test(endpoint.source)) {
                    downloadUrl = endpoint.source;
                }
                else {
                    downloadUrl = `${src}/download/bower/${endpoint.source}/${version}`;
                }
                let downloadPath = tmp.dirSync({ unsafeCleanup: true });
                return download_1.default(downloadUrl, downloadPath.name, bower.config).then((archivePatch) => {
                    let extractPath = tmp.dirSync({ unsafeCleanup: true });
                    return extract_1.default(archivePatch, extractPath.name).then(() => {
                        downloadPath.removeCallback();
                        process.on("exit", () => {
                            try {
                                extractPath.removeCallback();
                            }
                            catch (e) {
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
