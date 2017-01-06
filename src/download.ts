"use strict";
/**
 * Download module.
 * @module download
 */
import * as fs from "fs";
import * as request from "request";
import * as retry from "retry";
import * as tmp from "tmp";
import * as url from "url";
import createError from "./createError";
import ErrorN from "./ErrorN";

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
 * @param {BowerConfig} config - The Bower configuration
 * @returns {Promise}
 */
const download = (requestUrl: string, downloadPath: string, config: BowerConfig): Promise<any> => {
    const parsedUrl = url.parse(requestUrl);
    const file = tmp.tmpNameSync({dir: downloadPath, postfix: ".upack"});

    return new Promise((resolve, reject) => {
        // Prepare the retry module
        const retryOptions = Object.assign({
            factor: 2,
            maxTimeout: 35000,
            minTimeout: 1000,
            randomize: true,
            retries: 5
        }, config.retry || {});

        // Prepare the request
        let _request = request.defaults({
            ca: config.ca.search[0],
            proxy: parsedUrl.protocol === "https:" ? config.httpsProxy : config.proxy,
            strictSSL: config.strictSsl,
            timeout: config.timeout
        });

        _request = _request.defaults(config.request || {});

        // Retry on network errors
        const operation = retry.operation(retryOptions);

        operation.attempt(() => {
            let req;
            let writeStream;
            let contentLength;
            let bytesDownloaded = 0;

            // The request is execute here
            req = _request(requestUrl)
                .on("response", (res) => {
                    const status = res.statusCode;

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
                        req.emit("error",
                            createError(
                                `Transfer closed with ${(contentLength - bytesDownloaded)} bytes remaining to read`,
                                "EINCOMPLETE"
                            )
                        );
                    }
                })
                .on("error", (error: ErrorN) => {
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
};

export default download;
