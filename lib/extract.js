"use strict";
const AdmZip = require("adm-zip");
const createError_1 = require("./createError");
const fs = require("fs");
const path = require("path");
const extract = (src, dst) => {
    return new Promise((resolve, reject) => {
        if (!(/.*\.upack$/.test(src))) {
            return reject(createError_1.default(`File ${src} is not a known archive`, "ENOTARCHIVE"));
        }
        fs.stat(src, (err, stats) => {
            if (err) {
                throw err;
            }
            else {
                if (stats.size <= 8) {
                    reject(createError_1.default(`File ${src} is an invalid archive`, "ENOTARCHIVE"));
                }
                else {
                    new AdmZip(src).extractAllTo(dst);
                    fs.unlink(path.join(dst, "upack.json"), (errU) => {
                        resolve(errU);
                    });
                }
            }
        });
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = extract;
