"use strict";

/**
 * Utils module.
 * @module utils
 */

const semver = require("semver");
const createError = require("./createError");

const regex = {
    progetPkgOnly: /^[^\/?]+$/,
    progetGrpPkg: /^[^\/?]+\/[^\/]+$/,
    progetFeedGrpPkg: /^[^\/?]+\/[^\/]+\/[^\/]+$/,
    progetUrl: /.+\?[^\/?]+\/[^\/]+\/[^\/]+$/
};

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

/**
 * Call the server response parsing
 *
 * @param {string} response - The server response
 * @return {Array.<{release: string, target: string, version: string}>}
 */
function extractReleases(response) {
    return releases(tags(extractRefs(response)));
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
        let findSource,
            c = config.proget;

        if (regex.progetPkgOnly.test(source)) {
            // Only package provided
            findSource = `${c.server}?${c.feed}/${c.group || "bower"}/${source}`;
        } else if (regex.progetGrpPkg.test(source)) {
            // Group and package provided
            findSource = `${c.server}?${c.feed}/${source}`;
        } else if (regex.progetFeedGrpPkg.test(source)) {
            // Feed, group and package provided
            findSource = `${c.server}?${source}`;
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
    extractReleases,
    registryParser
};
