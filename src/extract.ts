"use strict";
/**
 * Extract module.
 * @module extract
 */
import * as AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";
import createError from "./createError";

/**
 * Extract the ZIP archive
 *
 * @param {string} src - The source directory
 * @param {string} dst - The destination directory
 * @param {BowerLogger} logger - Logging method provide by bower
 * @returns {Promise}
 */
const extract = (src: string, dst: string, logger: BowerLogger): Promise<any> => {
    return new Promise((resolve: Function, reject: Function) => {
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
                } else {
                    // Extract archive
                    new AdmZip(src).extractAllTo(dst);
                    logger.action("extract", "upack.json");

                    resolve();

                    // Delete the now unwanted file upack.json
                    fs.unlink(path.join(dst, "upack.json"), () => {
                        resolve();
                    });
                }
            }
        });
    });
};

export default extract;
