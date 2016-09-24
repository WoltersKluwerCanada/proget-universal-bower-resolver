"use strict";

const fs = require("fs");
const rimraf = require("rimraf");

const PROGET_PREFIX = require("../../lib/utils").PROGET_PREFIX;

// Server information
const testPort = "8080";
const testApiKey = "banana";

/**
 * Create a temp folder
 *
 * @param {string} path - Path to the temp package
 * @param {function} callback - The method to call after the execution
 */
const createTestFolder = (path, callback) => {
    fs.stat(path, (err) => {
        if (err && err.code === "ENOENT") {
            // Folder don't exist
            fs.mkdir(path, (err) => {
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            });
        } else {
            // Clear the content of the folder, just in case
            rimraf(path.join(path, "*"), (err) => {
                if (err) {
                    callback(err);
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

const bowerConfig = {
    directory: "bower_components",
    registry: {
        default: "https://bower.herokuapp.com",
        search: [],
        register: "https://bower.herokuapp.com",
        publish: "https://bower.herokuapp.com"
    },
    shorthandResolver: "git://github.com/{{owner}}/{{package}}.git",
    timeout: 120000,
    ca: {search: []},
    strictSsl: true,
    color: true,
    resolvers: ["proget-universal-bower-resolver"],
    proget: {
        server: `http://localhost:${testPort}`,
        apiKey: testApiKey,
        feed: 23,
        group: "bower"
    },
    interactive: true,
    argv: {
        remain: ["install"],
        cooked: ["install"],
        original: ["install"]
    }
};

const expectedRequestAnswer = {
    forPkgInfo: JSON.stringify([{
        "ProGetPackage_Id": 1,
        "Version_Text": "1.1.1",
        "PackageHash_Bytes": "ebXlcWOoY4x6J9qY8S4z5QuSp/o=",
        "PackageMetadata_Bytes": "eyJ0aXRsZSI6InBrZyIsImRlc2NyaXB0aW9uIjoiQSBjcmF6eSBib3dlciBwYWNrYWdlISJ9",
        "Published_Date": "2016-06-01T07:03:15.553",
        "Package_Size": 20231,
        "Download_Count": 7,
        "Cached_Indicator": false
    }, {
        "ProGetPackage_Id": 1,
        "Version_Text": "2.2.2",
        "PackageHash_Bytes": "6BY64NQaFzEdw2zQjckBRlRUc20=",
        "PackageMetadata_Bytes": "eyJ0aXRsZSI6InBrZyIsImRlc2NyaXB0aW9uIjoiQSBjcmF6eSBib3dlciBwYWNrYWdlISJ9",
        "Published_Date": "2016-06-01T07:03:15.557",
        "Package_Size": 20235,
        "Download_Count": 11,
        "Cached_Indicator": false
    }]),
    forFeedInfo: JSON.stringify({
        "Feed_Id": 23,
        "Feed_Name": "feedName",
        "Feed_Description": null,
        "Active_Indicator": true,
        "Cache_Connectors_Indicator": true,
        "DropPath_Text": null,
        "FeedPathOverride_Text": null,
        "FeedType_Name": "ProGet",
        "PackageStoreConfiguration_Xml": null
    })
};

module.exports = {
    PROGET_PREFIX,
    createTestFolder,
    deleteTestFolder,
    testPort,
    testApiKey,
    bowerConfig,
    expectedRequestAnswer,
    testAddress: `http://localhost:${testPort}`
};