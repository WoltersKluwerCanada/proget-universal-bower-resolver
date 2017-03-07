"use strict";

import * as decompress from "extract-zip";
import * as fs from "fs";
import * as path from "path";
import createError from "./createError";
import ErrorN from "./ErrorN";

/**
 * Extract the ZIP archive
 */
const extract = (from: string, to: string, logger: BowerLogger): Promise<any> => {
    return new Promise((resolve: () => void, reject: (error: ErrorN) => void) => {
        // Validate that the source as supported extension
        if (!(/.*\.upack$/.test(from))) {
            reject(createError(`File ${from} is not a known archive`, "ENOTARCHIVE"));
        } else {
            logger.action("extract", "upack.json");

            decompress(from, {dir: to}, (err_: ErrorN) => {
                if (err_ && err_.code === "ENOENT") {
                    reject(createError(`File ${from} is an invalid archive`, "ENOTARCHIVE"));
                } else if (err_) {
                    reject(err_);
                } else {
                    // Delete the now unwanted file upack.json
                    fs.unlink(path.join(to, "upack.json"), () => {
                        resolve();
                    });
                }
            });
        }
    });
};

export default extract;
