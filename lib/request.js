"use strict";

/**
 * Request module.
 * @module request
 */

const request = require("request");
const Promise = require("bluebird");
const Url = require("url");
const createError = require("./createError");

/**
 * Communication with the server
 *
 * @param {string} url - The requested url
 * @param {string} adr - The API formatted url
 * @param {function} resolve - The Promise pass answer
 * @param {function} reject - The Promise fail answer
 * @param {{}} params - The parameters for the API call
 * @param {{}} config - The bower configuration
 */
function communication(url, adr, resolve, reject, params, config) {
    let _request = request.defaults({
        proxy: Url.parse(url).protocol === "https:" ? config.httpsProxy : config.proxy,
        ca: config.ca.search[0],
        strictSSL: config.strictSsl,
        timeout: config.timeout,
        qs: params
    });

    _request = _request.defaults(config.request || {});

    _request(adr, function(error, response, body) {
        if (error) {
            reject(createError(`Request to ${url} failed: ${error.message}`, error.code));
        } else {
            if (response.statusCode === 200) {
                resolve(body);
            } else {
                reject(createError(`Request to ${url} returned ${response.statusCode} status code.`, "EREQUEST", {
                    details: response.toString()
                }));
            }
        }
    });
}

/**
 * Find the Feed ID from a feed name
 *
 * @param {string} url - The requested url
 * @param {function} reject - The Promise fail answer
 * @param {{}} params - The parameters for the API call
 * @param {{}} config - The bower configuration
 * @param {function} callback
 */
function findFeedId(url, reject, params, config, callback) {
    let reqID = url.split("?")[0] + "/api/json/Feeds_GetFeed";

    communication(url, reqID, callback, reject, {Feed_Name: params.Feed_Id, API_Key: params.API_Key}, config);
}

/**
 * Send GET request to the host
 *
 * @param {string} requestUrl - The url of the request
 * @param {string} apiMethod - The ProGet api method to use
 * @param {{}} config - The Bower configuration
 * @returns {Promise}
 */
let req = (requestUrl, apiMethod, config) => {
    return new Promise((resolve, reject) => {
        if (!config.hasOwnProperty("proget")) {
            reject(createError("Missing parameter 'proget' in Bower configuration.", "EBOWERC"));
        }

        let rUrl = requestUrl.split("?"),
            adr = rUrl[0] + "/api/json/" + apiMethod,
            rParams = rUrl[1].split("/");

        // Prepare the request
        let params = {
            API_Key: config.proget.apiKey || "",
            Feed_Id: rParams[0],
            Group_Name: rParams[1] || "bower",
            Package_Name: rParams[2]
        };

        if (params.API_Key === "") {
            reject(createError("Their is no 'apiKey' set on your system, please add one to you .bowerrc file. Seed documentation for HowTo.", "EMISSAPIKEY"));
        }

        // Test if we have the id or the feed name
        if (/^\d+$/.test(rParams[0])) {
            // If we have an ID
            communication(requestUrl, adr, resolve, reject, params, config);
        } else {
            // If we have a name
            findFeedId(requestUrl, reject, params, config, (data) => {
                if (data) {
                    params.Feed_Id = JSON.parse(data).Feed_Id;
                    communication(requestUrl, adr, resolve, reject, params, config);
                } else {
                    reject(createError(`Unable to found the Feed with the name ${params.Feed_Id}`, "EBOWERC"));
                }
            });
        }
    });
};

module.exports = req;