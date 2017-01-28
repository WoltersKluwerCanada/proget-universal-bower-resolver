"use strict";

import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";
import extract from "../src/extract";
import * as share from "./data/share";

// Test the Extract module methods
describe("extract", function() {
    const testFolder = path.join(__dirname, "data", "extract");

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
                            let sourceUpack;
                            let extractedUpack;

                            fs.readFile(path.join(__dirname, "data", "upack.json"), (err_, content) => {
                                if (err_) {
                                    done(err_);
                                } else {
                                    sourceUpack = content;

                                    fs.readFile(path.join(testFolder, "_upack.json"), (err__, content_) => {
                                        if (err__) {
                                            done(err__);
                                        } else {
                                            extractedUpack = content_;
                                            expect(sourceUpack).eql(extractedUpack);
                                            done();
                                        }
                                    });
                                }
                            });
                        } else {
                            done(new Error(`Err: Wrong number of files extracted, count ${files.length}, want 2.`));
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
