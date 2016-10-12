"use strict";

/**
 * Utils module.
 * @module utils
 */

const createError = require("./createError");

const regex = {
    progetPkgOnly: /^[^\/?]+$/,
    progetGrpPkg: /^[^\/?]+\/[^\/]+$/,
    progetFeedGrpPkg: /^[^\/?]+\/[^\/]+\/[^\/]+$/,
    progetUrl: /.+\?[^\/?]+\/[^\/]+\/[^\/]+$/
};

function isSourceUrl(source){
    return /^(https?|ssh|git):\/\/.*/.test(source);
}

/**
 * Create a URL usable for ProGet from a package name
 *
 * @param {string} source - The package as write in the bower.json file
 * @param {{}} config - The Bower configuration
 * @return {string} - The result url
 */
function registryParser(source, config) {
    let sourceParts = source.split("=");
    source = sourceParts[1] || sourceParts[0];

    if (/^https?:\/\/.*/.test(source)) {
        return source;
    }

    if (config.hasOwnProperty("proget") && config.proget.hasOwnProperty("server")) {
        let findSource;
        let progetConfig = config.proget;

        if (regex.progetPkgOnly.test(source)) {
            // Only package provided
            findSource = `${progetConfig.server}?${progetConfig.feed}/${progetConfig.group || "bower"}/${source}`;
        } else if (regex.progetGrpPkg.test(source)) {
            // Group and package provided
            findSource = `${progetConfig.server}?${progetConfig.feed}/${source}`;
        } else if (regex.progetFeedGrpPkg.test(source)) {
            // Feed, group and package provided
            findSource = `${progetConfig.server}?${source}`;
        } else if (regex.progetUrl.test(source)) {
            // Full url provided
            findSource = source;
        }

        if (findSource) {
            return findSource;
        } else {
            throw createError("No source found for " + source, "ESRCNF");
        }
    } else {
        throw createError("No proget.server found in bower configuration", "ESRCNF");
    }
}

module.exports = {
    registryParser,
    isSourceUrl
};
