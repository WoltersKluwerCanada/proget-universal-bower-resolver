"use strict";

import * as  fs from "fs";
import * as http from "http";
import * as path from "path";
import * as url from "url";
import * as share from "./../share";

const defaultHttpHeader = {
    "Cache-Control": "private"
};

const header = {
    download: {
        "Content-Length": fs.statSync(path.join(__dirname, "..", "empty.zip")).size,
        "Content-Type": "application/octet-stream"
    },
    downloadErr: {
        "Content-Length": fs.statSync(path.join(__dirname, "..", "empty.zip")).size + 100,
        "Content-Type": "application/octet-stream"
    },
    getFeed: {
        "Content-Type": "application/json"
    },
    request: {
        "Content-Type": "application/json"
    }
};
Object.assign(header.download, defaultHttpHeader);
Object.assign(header.request, defaultHttpHeader);
Object.assign(header.getFeed, defaultHttpHeader);

let started = false;

const zipPackage = fs.readFileSync(path.join(__dirname, "..", "empty.zip"));

/**
 * Parse a GET query to JSON
 *
 * @param [query] - The GET query
 * @return {{}} - The JSON result
 */
function parseQuery(query) {
    query = query || "";

    const elems = query.split("&");
    const out = {};
    let part;

    for (const elem of elems) {
        part = elem.split("=");
        out[part[0]] = part[1];
    }

    return out;
}

/**
 * Route the request to their methods
 *
 * @param request - The client request
 * @param response - The server response
 */
function router(request, response) {
    const query = url.parse(request.url).query;

    if (request.method === "POST"
        && (request.url === "/upack/feedName/download/bower/packageName/version"
        || request.url === "/upack/feedName/download/bower/packageName/1.1.1")) {
        // Download
        responseToDownload(response);
    } else if (request.method === "POST"
        && request.url === "/upack/feedName/download/bower/packageName/version.WrongSize") {
        // Download with file size error
        responseToDownloadWrongSize(response);
    } else if (request.method === "POST"
        && request.url === "/upack/feedName/download/bower/packageName/version.BadHtmlCode") {
        // Download with file size error
        responseHtmlError(response);
    } else {
        const data: any = parseQuery(query);
        const split: string[] = request.url.split("?");
        const partial: string = split[0];
        const params: string[] = split[1].split("&");

        if (data.API_Key === share.testApiKey) {
            if (request.method === "POST"
                && (partial === "/api/json/ProGetPackages_GetPackageVersions"
                || partial === "/api/json/ProGetPackages_GetPackages")
                && params.some((x) => x.split("=")[1] === "packageName")) {
                responseToRequest(response, data);
            } else if (request.method === "POST" && partial === "/api/json/Feeds_GetFeed") {
                responseToGetFeed(response, data);
            } else {
                responseToRequest(response, {});
            }
        } else {
            responseHtmlError(response);
        }
    }
}

/**
 * Download the test zip package
 *
 * @param response - The server response
 */
function responseToDownload(response) {
    response.writeHead(200, header.download);
    response.end(zipPackage);
}

/**
 * Download the test zip package with a wrong file size in header
 *
 * @param response - the response that will send the server
 */
function responseToDownloadWrongSize(response) {
    response.writeHead(200, header.downloadErr);
    response.end(zipPackage);
}

/**
 * Return a error code
 *
 * @param response - the response that will send the server
 */
function responseHtmlError(response) {
    response.writeHead(400);
    response.end();
}

/**
 * Return the response to the request module
 *
 * @param response - the response that will send the server
 * @param {{Feed_Id: string}|{}} data - The request data
 */
function responseToRequest(response, data) {
    if (data.Feed_Id === "23") {
        response.writeHead(200, header.getFeed);
        response.end(share.expectedRequestAnswer.forPkgInfo1);
    }

    if (data.Feed_Id === "42") {
        response.writeHead(200, header.getFeed);
        response.end(share.expectedRequestAnswer.forPkgInfo2);
    } else {
        response.writeHead(200, header.getFeed);
        response.end("[{}]");
    }
}

/**
 * Return the feed name
 *
 * @param response - the response that will send the server
 * @param {{Feed_Id: string}|{Feed_Name: string}|{}} data - The request data
 */
function responseToGetFeed(response, data) {
    if (data.Feed_Id === "23") {
        response.writeHead(200, header.getFeed);
        response.end(share.expectedRequestAnswer.forFeedInfo1);
    } else if (data.Feed_Name === "feedName") {
        response.writeHead(200, header.getFeed);
        response.end(share.expectedRequestAnswer.forFeedInfo1);
    } else if (data.Feed_Id === "42") {
        response.writeHead(200, header.getFeed);
        response.end(share.expectedRequestAnswer.forFeedInfo2);
    } else if (data.Feed_Name === "wk-develop-bower") {
        response.writeHead(200, header.getFeed);
        response.end(share.expectedRequestAnswer.forFeedInfo2);
    } else {
        response.writeHead(200, header.getFeed);
        response.end();
    }
}

// Create a server
const server = http.createServer(router);

/**
 * Request to start the server
 *
 * @param callback - The method to call after the execution
 */
const startServer = (callback) => {
    if (!started) {
        started = true;

        server.listen(share.testPort, () => {
            callback();
        });
    } else {
        callback();
    }
};

/**
 * Request to close the server
 *
 * @param callback - The method to call after the execution
 */
const stopServer = (callback) => {
    if (started) {
        started = false;

        server.close(() => {
            callback();
        });
    } else {
        callback();
    }
};

export {
    startServer,
    stopServer
};
