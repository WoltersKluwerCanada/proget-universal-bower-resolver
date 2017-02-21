"use strict";

import * as fs from "fs";
import * as request from "request";
import * as retry from "retry";
import * as tmp from "tmp";
import * as url from "url";
import createError from "./createError";
import ErrorN from "./ErrorN";

/**
 * Download request
 */
const downloadRunner = (file: string, bower: Bower, requestUrl: string, requestInstance, cb: Function): void => {
    const config = bower.config;

    // Prepare the retry module
    const retryOptions = Object.assign({
        factor: 2,
        maxTimeout: 20000,
        minTimeout: 1000,
        randomize: true,
        retries: 4
    }, config.retry || {});

    // Retry on network errors
    const operation = retry.operation(retryOptions);
    const writeStreamSingleInstance = fs.createWriteStream(file);

    operation.attempt((currentAttempt) => {
        let req;
        let writeStream;
        let contentLength;
        let bytesDownloaded = 0;
        let lastError;

        // The request is execute here
        req = requestInstance(requestUrl)
            .on("response", (res) => {
                const status = res.statusCode;

                lastError = null;

                if (status >= 200 && status < 300) {
                    contentLength = Number(res.headers["content-length"]);
                } else if (status >= 300 && status < 400) {
                    const redirection = res.headers.location.toString();

                    // Get a redirection, retry with new URL
                    bower.logger.debug("redirect", `${requestUrl} --> ${redirection}`);
                    requestUrl = redirection;

                    // Ensure that there are no more events from this request
                    req.removeAllListeners();

                    // Ensure that there are no more events from the write stream
                    writeStream.removeAllListeners();

                    downloadRunner(file, bower, requestUrl, requestInstance, cb);

                    return;
                } else {
                    req.emit("error", createError(`Status code of ${status} for ${requestUrl}`, "EHTTP", {
                        details: `${res}`
                    }));
                }
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

                // Still have retry?
                if (!operation.retry(lastError)) {
                    writeStream.end();
                }
            })
            .on("error", (error: ErrorN) => {
                // Network error
                lastError = error;

                bower.logger.error(
                    "download",
                    `${error.message} for attempt ${currentAttempt}/${retryOptions.retries + 1}`,
                    error
                );

                return;
            });

        // Pipe read stream to write stream
        writeStream = req
            .pipe(writeStreamSingleInstance)
            .on("error", (err) => {
                // File system error
                bower.logger.error(
                    "File system",
                    `${err.message} for attempt ${currentAttempt}/${retryOptions.retries + 1}`,
                    err
                );

                // Still have retry?
                if (!operation.retry(err)) {
                    writeStream.end();
                }
            })
            .on("close", () => {
                bower.logger.debug("File system", `Create "${file}" from "${requestUrl}"`);
                cb(operation.mainError(), file);
            });
    });
};

/**
 * Download the package from the server
 */
const download = (requestUrl: string, downloadPath: string, bower: Bower): Promise<any> => {
    const config = bower.config;
    const parsedUrl = url.parse(requestUrl);
    const file = tmp.tmpNameSync({dir: downloadPath, postfix: ".upack"});

    return new Promise((resolve, reject) => {
        // Prepare the request
        let _request = request.defaults({
            ca: config.ca.search[0],
            followRedirect: false,
            proxy: parsedUrl.protocol === "https:" ? config.httpsProxy : config.proxy,
            strictSSL: config.strictSsl,
            timeout: config.timeout
        });

        _request = _request.defaults(config.request || {});

        downloadRunner(file, bower, requestUrl, _request, (err, fileName) => {
            if (err) {
                reject(err);
            } else {
                bower.logger.action("download", requestUrl);
                resolve(fileName);
            }
        });
    });
};

export default download;
