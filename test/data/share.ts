"use strict";

import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";

// Server information
const testPort = "8080";
const testApiKey = "testP4ssw0rd";

/**
 * Create a temp folder
 *
 * @param {string} path - Path to the temp package
 * @param {function} callback - The method to call after the execution
 */
const createTestFolder = (dest, callback) => {
    fs.stat(dest, (err) => {
        if (err && err.code === "ENOENT") {
            // Folder don't exist
            fs.mkdir(dest, (err_) => {
                if (err_) {
                    callback(err_);
                } else {
                    callback();
                }
            });
        } else {
            // Clear the content of the folder, just in case
            rimraf(path.join(dest, "*"), (err_) => {
                if (err_) {
                    callback(err_);
                } else {
                    callback();
                }
            });
        }
    });
};

/**
 * Delete a temp folder
 *
 * @param {string} path - PPath to the temp package
 * @param {function} callback - The method to call after the execution
 */
const deleteTestFolder = (path, callback) => {
    rimraf(path, (err) => {
        if (err) {
            callback(err);
        } else {
            callback();
        }
    });
};

const bowerConfig: BowerConfig = {
    ca: {search: []},
    color: true,
    directory: "bower_components",
    interactive: true,
    proget: {
        apiKeyMapping: [
            {
                key: testApiKey,
                server: `http://localhost:${testPort}`
            }
        ]
    },
    registry: {
        default: "https://bower.herokuapp.com",
        publish: "https://bower.herokuapp.com",
        register: "https://bower.herokuapp.com",
        search: [
            `http://localhost:${testPort}/upack/23`,
            `http://localhost:${testPort}/upack/42`
        ]
    },
    resolvers: ["proget-universal-bower-resolver"],
    strictSsl: true,
    timeout: 120000
};

/**
 * The result we were expecting as response from the server
 *
 * @type {{forPkgInfo1: string, forPkgInfo2: string, forFeedInfo1: string, forFeedInfo2: string}}
 */
const expectedRequestAnswer = {
    forFeedInfo1: JSON.stringify({
        Active_Indicator: true,
        Cache_Connectors_Indicator: true,
        DropPath_Text: null,
        FeedPathOverride_Text: null,
        FeedType_Name: "ProGet",
        Feed_Description: null,
        Feed_Id: 23,
        Feed_Name: "feedName",
        PackageStoreConfiguration_Xml: null
    }),
    forFeedInfo2: JSON.stringify({
        Active_Indicator: true,
        Cache_Connectors_Indicator: true,
        DropPath_Text: null,
        FeedPathOverride_Text: null,
        FeedType_Name: "ProGet",
        Feed_Description: null,
        Feed_Id: 42,
        Feed_Name: "wk-develop-bower",
        PackageStoreConfiguration_Xml: null
    }),
    forPkgInfo1: JSON.stringify([{
        Cached_Indicator: false,
        Download_Count: 7,
        PackageHash_Bytes: "ebXlcWOoY4x6J9qY8S4z5QuSp/o=",
        PackageMetadata_Bytes: "eyJ0aXRsZSI6InBrZyIsImRlc2NyaXB0aW9uIjoiQSBjcmF6eSBib3dlciBwYWNrYWdlISJ9",
        Package_Size: 20231,
        ProGetPackage_Id: 1,
        Published_Date: "2016-06-01T07:03:15.553",
        Version_Text: "1.1.1"
    }, {
        Cached_Indicator: false,
        Download_Count: 11,
        PackageHash_Bytes: "6BY64NQaFzEdw2zQjckBRlRUc20=",
        PackageMetadata_Bytes: "eyJ0aXRsZSI6InBrZyIsImRlc2NyaXB0aW9uIjoiQSBjcmF6eSBib3dlciBwYWNrYWdlISJ9",
        Package_Size: 20235,
        ProGetPackage_Id: 1,
        Published_Date: "2016-06-01T07:03:15.557",
        Version_Text: "2.2.2"
    }]),
    forPkgInfo2: JSON.stringify([{
        Cached_Indicator: false,
        Download_Count: 7,
        PackageHash_Bytes: "ebXlcWOoY4x6J9qY8S4z5QuSp/o=",
        PackageMetadata_Bytes: "eyJ0aXRsZSI6InBrZyIsImRlc2NyaXB0aW9uIjoiQSBjcmF6eSBib3dlciBwYWNrYWdlISJ9",
        Package_Size: 20231,
        ProGetPackage_Id: 1,
        Published_Date: "2016-06-01T07:03:15.600",
        Version_Text: "1.1.1"
    }, {
        Cached_Indicator: false,
        Download_Count: 11,
        PackageHash_Bytes: "6BY64NQaFzEdw2zQjckBRlRUc20=",
        PackageMetadata_Bytes: "eyJ0aXRsZSI6InBrZyIsImRlc2NyaXB0aW9uIjoiQSBjcmF6eSBib3dlciBwYWNrYWdlISJ9",
        Package_Size: 20235,
        ProGetPackage_Id: 1,
        Published_Date: "2016-06-01T07:03:15.700",
        Version_Text: "3.3.3"
    }])
};

const bowerLogger: BowerLogger = {
    action: () => {
        // No need to run anything here
    },
    conflict: () => {
        // No need to run anything here
    },
    debug: () => {
        // No need to run anything here
    },
    error: () => {
        // No need to run anything here
    },
    geminate: () => {
        // No need to run anything here
    },
    info: () => {
        // No need to run anything here
    },
    intercept: () => {
        // No need to run anything here
    },
    log: () => {
        // No need to run anything here
    },
    pipe: () => {
        // No need to run anything here
    },
    prompt: () => {
        // No need to run anything here
    },
    warn: () => {
        // No need to run anything here
    }
};

const testAddress: string = `http://localhost:${testPort}`;

const fullAddress: string = `http://localhost:${testPort}/upack/feedName/download/bower/packageName/version`;

export {
    createTestFolder,
    deleteTestFolder,
    testPort,
    testApiKey,
    bowerConfig,
    bowerLogger,
    expectedRequestAnswer,
    testAddress,
    fullAddress
};
