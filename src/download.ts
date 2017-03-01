"use strict";

import * as fs from "fs";
import * as request from "request";
import * as retry from "retry";
import * as tmp from "tmp";
import * as url from "url";
import Authentication from "./Authentication";
import createError from "./createError";
import ErrorN from "./ErrorN";

/**
 * Download request
 */
const downloadRunner = (file: string, bower: Bower, requestUrl: string, requestInstance, auth: boolean,
                        cb: (err: Error, data: string) => void): void => {
    const config = bower.config;
    const retryCommunication = (req, writeStream) => {
        // Ensure that there are no more events from this request
        req.removeAllListeners();

        // Ensure that there are no more events from the write stream
        writeStream.removeAllListeners();

        downloadRunner(file, bower, requestUrl, requestInstance, auth, cb);
    };

    let credential = {};

    if (auth) {
        const cred = Authentication.getInstance().getCredentialsByURI(requestUrl);

        if (cred) {
            credential = {
                auth: {
                    pass: cred.password,
                    user: cred.username
                }
            };
        } else {
            // If no config for a feed is found, send an error to Bower
            const error = createError(`Authentication error.`, "pubr - auth");

            bower.logger.error(
                "pubr - auth",
                `No authentication set in .npmrc for: ${Authentication.nerf(requestUrl)}`,
                error
            );

            cb(error, null);
            return;
        }
    }

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
        req = requestInstance(requestUrl, credential)
            .on("response", (res) => {
                const status = res.statusCode;

                lastError = null;

                if (status >= 200 && status < 300) {
                    contentLength = Number(res.headers["content-length"]);
                } else if (status >= 300 && status < 400) {
                    // Redirection
                    const redirection = res.headers.location.toString();

                    // Get a redirection, retry with new URL
                    bower.logger.debug("redirect", `${requestUrl} --> ${redirection}`);
                    requestUrl = redirection;

                    retryCommunication(req, writeStream);

                    return;
                } else if (status === 401) {
                    // Request authentication
                    bower.logger.debug("pubr - auth", `${requestUrl} require authentication`);
                    // To not try to authenticate infinitely
                    if (!auth) {
                        auth = true;

                        retryCommunication(req, writeStream);

                        return;
                    } else {
                        // The page already require for authentication and still asking for it, so this is an error
                        req.emit("error", createError(`Status multiple consecutive ${status} code for ${requestUrl}`, "EHTTP", {
                            details: `${res}`
                        }));
                    }
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

        downloadRunner(file, bower, requestUrl, _request, false, (err, fileName) => {
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
