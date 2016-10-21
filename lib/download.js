"use strict";

/**
 * Download module.
 * @module download
 */

const Promise = require("bluebird");
const object = require("mout/object");
const createError = require("./createError");
const request = require("request");
const retry = require("retry");
const tmp = require("tmp");

const fs = require("fs");
const url = require("url");

const errorCodes = [
    "EADDRINFO",
    "ECONNRESET",
    "ESOCKETTIMEDOUT",
    "ETIMEDOUT"
];

/**
 * Download the package from the server
 *
 * @param {string} requestUrl - The url to download the package from
 * @param {string} downloadPath - The path to download the file in
 * @param {bowerConf} config - The Bower configuration
 * @returns {Promise}
 */
function download(requestUrl, downloadPath, config) {
    let parsedUrl = url.parse(requestUrl),
        file = tmp.tmpNameSync({dir: downloadPath, postfix: ".upack"});

    return new Promise((resolve, reject) => {
        // Prepare the retry module
        let retryOptions = object.mixIn({
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 35000,
            randomize: true
        }, config.retry || {});

        // Prepare the request
        let _request = request.defaults({
            proxy: parsedUrl.protocol === "https:" ? config.httpsProxy : config.proxy,
            ca: config.ca.search[0],
            strictSSL: config.strictSsl,
            timeout: config.timeout
        });

        _request = _request.defaults(config.request || {});

        // Retry on network errors
        let operation = retry.operation(retryOptions);

        operation.attempt(() => {
            let req,
                writeStream,
                contentLength,
                bytesDownloaded = 0;

            // The request is execute here
            req = _request(requestUrl)
                .on("response", (res) => {
                    let status = res.statusCode;

                    if (status < 200 || status >= 300) {
                        return reject(createError(`Status code of ${status} for ${requestUrl}`, "EHTTP", {
                            details: `${res}`
                        }));
                    }
                    contentLength = Number(res.headers["content-length"]);
                })
                .on("data", (data) => {
                    bytesDownloaded += data.length;
                })
                .on("end", () => {
                    // If transmission failed end without a full download
                    if (contentLength && bytesDownloaded < contentLength) {
                        req.emit("error", createError(`Transfer closed with ${(contentLength - bytesDownloaded)} bytes remaining to read`, "EINCOMPLETE"));
                    }
                })
                .on("error", (error) => {
                    // Reject if error is not a network error
                    if (errorCodes.indexOf(error.code) === -1) {
                        return reject(error);
                    }

                    // Check if there are more retries
                    if (operation.retry(error)) {
                        // Ensure that there are no more events from this request
                        req.removeAllListeners();

                        // Ensure that there are no more events from the write stream
                        writeStream.removeAllListeners();
                    }

                    // No more retries, reject!
                    reject(error);
                });

            // Pipe read stream to write stream
            writeStream = req
                .pipe(fs.createWriteStream(file))
                .on("error", reject)
                .on("close", () => {
                    resolve(file);
                });
        });
    });
}

module.exports = download;
