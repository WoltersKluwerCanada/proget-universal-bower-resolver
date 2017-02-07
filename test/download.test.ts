"use strict";

import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";
import * as server from "./data/fake/fakeHtttpServer";
import * as share from "./data/share";

import download from "../src/download";

// Test the Download module methods
describe("download", function() {
    const testFolder = path.join(__dirname, "data", "download");

    before(function(done) {
        share.createTestFolder(testFolder, (err) => {
            if (err) {
                done(err);
            } else {
                server.startServer(done);
            }
        });
    });

    // Download a file from the fake server
    it("a file", function(done) {
        download(`${share.testAddress}/upack/feedName/download/bower/packageName/version`,
            testFolder, {config: share.bowerConfig, logger: share.bowerLogger, version: "0.0.0"}).then(
            () => {
                fs.readdir(testFolder, (err, files) => {
                    if (err) {
                        done(err);
                    } else {
                        const downloadedFile = path.join(testFolder, files[0]);
                        fs.stat(downloadedFile, (_err, stats) => {
                            if (_err) {
                                // Error when accessing the file
                                done(_err);
                            } else if (stats.size < 80) {
                                // Error if the file is too small
                                done(new Error(`Err: The downloaded file "${downloadedFile}" is too small.`));
                            } else {
                                // Everything is perfect!
                                done();
                            }
                        });
                    }
                });
            },
            (err) => {
                done(err);
            }
        );
    });

    // Download the file from a fake server but with wrong transfer size
    it("simulate a transfer error", function(done) {
        download(`${share.testAddress}/upack/feedName/download/bower/packageName/version.WrongSize`,
            testFolder, {config: share.bowerConfig, logger: share.bowerLogger, version: "0.0.0"}).then(
            () => {
                done(new Error("Error: This is suppose to fail. The file downloaded is smaller then the header tell."));
            },
            (err) => {
                expect(err).match(/^Error: Transfer closed with .* bytes remaining to read$/);
                expect(err).a("Error");
                done();
            }
        );
    });

    // HTTP error code when communicate with server
    it("simulate a HTML error response", function(done) {
        download(`${share.testAddress}/upack/feedName/download/bower/packageName/version.BadHtmlCode`,
            testFolder, {config: share.bowerConfig, logger: share.bowerLogger, version: "0.0.0"}).then(
            () => {
                done(new Error("Error: This is suppose to fail. The file downloaded is smaller then the header tell."));
            },
            (err) => {
                expect(err).match(/^Error: Status code of 400 for .*$/);
                expect(err).a("Error");
                done();
            }
        );
    });

    // Delete the test folder after usage
    after(function(done) {
        share.deleteTestFolder(testFolder, done);
    });
});
