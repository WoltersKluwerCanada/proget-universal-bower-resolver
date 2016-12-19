"use strict";

const chai = require("chai");
const expect = chai.expect;
const fs = require("fs");
const path = require("path");
const share = require("./data/share");
const server = require("./data/fake/fakeHtttpServer");

const download = require("../lib/download").default;

// Test the Download module methods
describe("download", function() {
    let testFolder = path.join(__dirname, "data", "download");

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
        download(`${share.testAddress}/upack/feedName/download/bower/packageName/version`, testFolder, share.bowerConfig).then(
            () => {
                fs.readdir(testFolder, (err, files) => {
                    if (err) {
                        done(err);
                    } else {
                        let downloadedFile = path.join(testFolder, files[0]);
                        fs.stat(downloadedFile, (err, stats) => {
                            if (err) {
                                // Error when accessing the file
                                done(err);
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
        download(`${share.testAddress}/upack/feedName/download/bower/packageName/version.WrongSize`, testFolder, share.bowerConfig).then(
            () => {
                done(new Error("Error: This test is suppose to fail because the file we download is is smaller than the header tell."));
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
        download(`${share.testAddress}/upack/feedName/download/bower/packageName/version.BadHtmlCode`, testFolder, share.bowerConfig).then(
            () => {
                done(new Error("Error: This test is suppose to fail because the file we download is is smaller than the header tell."));
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
