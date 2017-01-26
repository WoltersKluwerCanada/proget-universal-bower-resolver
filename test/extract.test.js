"use strict";

const chai = require("chai");
const expect = chai.expect;
const fs = require("fs");
const path = require("path");
const share = require("./data/share");

const extract = require("../lib/extract").default;

// Test the Extract module methods
describe("extract", function() {
    let testFolder = path.join(__dirname, "data", "extract");

    before(function(done) {
        share.createTestFolder(testFolder, done);
    });

    // Try to extract a zip archive, must fail
    it("extract an zip (Error)", function(done) {
        extract(path.join(__dirname, "data", "empty.zip"), testFolder, share.bowerLogger).then(
            () => {
                done(new Error("Err: Extract is not suppose to accept zip files."));
            },
            (err) => {
                expect(err).match(/^Error: File .*\.zip is not a known archive$/);
                expect(err).a("Error");
                done();
            }
        );
    });

    // Extract an .upack archive
    it("extract an upack", function(done) {
        extract(path.join(__dirname, "data", "pkg.upack"), testFolder, share.bowerLogger).then(
            () => {
                // Validate that the content was extracted
                fs.readdir(testFolder, (err, files) => {
                    if (err) {
                        done(err);
                    } else {
                        // Validate data integrity ----

                        // The archive contain 3 files, but upack.json is suppose to had been deleted
                        if (files.length === 2) {
                            let sourceUpack,
                                extractedUpack;

                            fs.readFile(path.join(__dirname, "data", "upack.json"), (err, content) => {
                                if (err) {
                                    done(err);
                                } else {
                                    sourceUpack = content;

                                    fs.readFile(path.join(testFolder, "_upack.json"), (err, content) => {
                                        if (err) {
                                            done(err);
                                        } else {
                                            extractedUpack = content;
                                            expect(sourceUpack).eql(extractedUpack);
                                            done();
                                        }
                                    });
                                }
                            });
                        } else {
                            done(new Error(`Err: Wrong number of files extracted, count ${files.length}, was suppose to only have 2.`));
                        }
                    }
                });
            },
            (err) => {
                done(err);
            }
        );
    });

    after(function(done) {
        share.deleteTestFolder(testFolder, done);
    });
});
