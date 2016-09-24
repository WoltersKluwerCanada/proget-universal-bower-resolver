"use strict";

/**
 * Extract module.
 * @module extract
 */

const AdmZip = require("adm-zip");
const createError = require("./createError");
const Promise = require("bluebird");

const fs = require("fs");
const path = require("path");

/**
 * Extract the ZIP archive
 *
 * @param {string} src - The source directory
 * @param {string} dst - The destination directory
 * @returns {Promise}
 */
function extract(src, dst) {
    return new Promise((resolve, reject) => {
        // Validate that the source is a zip archive
        if (!(/.*\.upack$/.test(src))) {
            return reject(createError(`File ${src} is not a known archive`, "ENOTARCHIVE"));
        }

        // If the src exist
        fs.stat(src, (err, stats) => {
            if (err) {
                throw err;
            } else {
                if (stats.size <= 8) {
                    reject(createError(`File ${src} is an invalid archive`, "ENOTARCHIVE"));
                }

                // Extract archive
                new AdmZip(src).extractAllTo(dst);

                // Delete the now unwanted file upack.json
                let upackPath = path.join(dst, "upack.json");
                fs.stat(upackPath, (err) => {
                    if (err) {
                        resolve();
                    } else {
                        fs.unlink(upackPath, () => {
                            resolve();
                        });
                    }
                });
            }
        });
    });
}

module.exports = extract;
