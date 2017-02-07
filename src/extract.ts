"use strict";

import * as decompress from "extract-zip";
import * as fs from "fs";
import * as path from "path";
import createError from "./createError";

/**
 * Extract the ZIP archive
 */
const extract = (from: string, to: string, logger: BowerLogger): Promise<any> => {
    return new Promise((resolve: Function, reject: Function) => {
        // Validate that the source as supported extension
        if (!(/.*\.upack$/.test(from))) {
            return reject(createError(`File ${from} is not a known archive`, "ENOTARCHIVE"));
        } else {
            // If the src exist
            fs.stat(from, (err, stats) => {
                if (err) {
                    throw err;
                } else {
                    if (stats.size <= 8) {
                        reject(createError(`File ${from} is an invalid archive`, "ENOTARCHIVE"));
                    } else {
                        // Extract archive
                        logger.action("extract", "upack.json");
                        decompress(from, {dir: to}, (err_) => {
                            if (err_) {
                                reject(err_);
                            } else {
                                // Delete the now unwanted file upack.json
                                fs.unlink(path.join(to, "upack.json"), () => {
                                    resolve();
                                });
                            }
                        });
                    }
                }
            });
        }
    });
};

export default extract;
