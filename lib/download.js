"use strict";
const request = require("request");
const tmp = require("tmp");
const createError_1 = require("./createError");
const fs = require("fs");
const url = require("url");
const retry = require("retry");
const errorCodes = [
    "EADDRINFO",
    "ECONNRESET",
    "ESOCKETTIMEDOUT",
    "ETIMEDOUT"
];
const download = (requestUrl, downloadPath, config) => {
    let parsedUrl = url.parse(requestUrl);
    let file = tmp.tmpNameSync({ dir: downloadPath, postfix: ".upack" });
    return new Promise((resolve, reject) => {
        let retryOptions = Object.assign({
            factor: 2,
            maxTimeout: 35000,
            minTimeout: 1000,
            randomize: true,
            retries: 5
        }, config.retry || {});
        let _request = request.defaults({
            ca: config.ca.search[0],
            proxy: parsedUrl.protocol === "https:" ? config.httpsProxy : config.proxy,
            strictSSL: config.strictSsl,
            timeout: config.timeout
        });
        _request = _request.defaults(config.request || {});
        let operation = retry.operation(retryOptions);
        operation.attempt(() => {
            let req;
            let writeStream;
            let contentLength;
            let bytesDownloaded = 0;
            req = _request(requestUrl)
                .on("response", (res) => {
                let status = res.statusCode;
                if (status < 200 || status >= 300) {
                    return reject(createError_1.default(`Status code of ${status} for ${requestUrl}`, "EHTTP", {
                        details: `${res}`
                    }));
                }
                contentLength = Number(res.headers["content-length"]);
            })
                .on("data", (data) => {
                bytesDownloaded += data.length;
            })
                .on("end", () => {
                if (contentLength && bytesDownloaded < contentLength) {
                    req.emit("error", createError_1.default(`Transfer closed with ${(contentLength - bytesDownloaded)} bytes remaining to read`, "EINCOMPLETE"));
                }
            })
                .on("error", (error) => {
                if (errorCodes.indexOf(error.code) === -1) {
                    return reject(error);
                }
                if (operation.retry(error)) {
                    req.removeAllListeners();
                    writeStream.removeAllListeners();
                }
                reject(error);
            });
            writeStream = req
                .pipe(fs.createWriteStream(file))
                .on("error", reject)
                .on("close", () => {
                resolve(file);
            });
        });
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = download;
//# sourceMappingURL=download.js.map