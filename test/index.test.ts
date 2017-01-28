"use strict";

import {expect} from "chai";
import Index from "../src/index";
import * as server from "./data/fake/fakeHtttpServer";
import {bowerConfig, bowerLogger, fullAddress, testAddress} from "./data/share";

const index = Index({
    config: bowerConfig,
    logger: bowerLogger,
    version: "0.0.0"
});

// Test the Main module methods
describe("index", function() {
    before(function(done) {
        server.startServer(done);
    });

    // Test the match method
    describe("match", function() {
        it("full matching url", function(done) {
            index.match(fullAddress).then(
                (res) => {
                    if (res === true) {
                        done();
                    } else {
                        done("This url is suppose to be supported");
                    }
                },
                (err) => {
                    done(err);
                }
            );
        });

        describe("partial matching url", function() {
            it("package only", function(done) {
                index.match("packageName").then(
                    (res) => {
                        if (res === true) {
                            done();
                        } else {
                            done("This url is suppose to be supported");
                        }
                    },
                    (err) => {
                        done(err);
                    }
                );
            });
        });

        it("full not matching url", function(done) {
            index.match("http://something-random.test").then(
                (res) => {
                    if (res === true) {
                        done("This url is not suppose to be supported");
                    } else {
                        done();
                    }
                },
                (err) => {
                    done(err);
                }
            );
        });

        it("not supported package", function(done) {
            index.match("angular").then(
                (data) => {
                    try {
                        expect(data).to.be.false;
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                (err) => {
                    done(err);
                }
            );
        });
    });

    // Test the releases method
    it("releases", function(done) {
        index.match("packageName").then(
            (res) => {
                if (res === true) {
                    try {
                        expect(index.releases("packageName")).to.have.lengthOf(4);

                        done();
                    } catch (e) {
                        done(e);
                    }
                } else {
                    done("This url is suppose to be supported");
                }
            },
            (err) => {
                done(err);
            }
        );
    });

    // Test the fetch method
    describe("fetch", function() {
        const endpoint = {
            name: "packageName",
            registry: true,
            source: "packageName",
            target: `${testAddress}/upack/feedName#1.1.1`
        };

        // Try like if bower have not already the package in cache
        it("without cached version", function(done) {
            const cached = {
                endpoint,
                release: "1.1.1",
                resolution: {}
            };

            index.fetch(endpoint, cached).then(
                (res) => {
                    expect(res.hasOwnProperty("tempPath")).to.be.true;
                    expect(res.hasOwnProperty("removeIgnores")).to.be.true;

                    done();
                },
                (err) => {
                    done(err);
                }
            );
        });

        // Try like if bower already have the package in cache
        it("with version in cache", function() {
            const cached = {
                releases: [
                    {
                        target: `${testAddress}/upack/feedName#1.0.0`,
                        version: "1.0.0"
                    },
                    {
                        target: `${testAddress}/upack/feedName#2.0.0`,
                        version: "2.0.0"
                    }
                ]
            };

            const res = index.fetch(endpoint, cached);

            // If the method is ignore, it return undefined
            expect(res).eql({});
        });
    });

    after(function(done) {
        server.stopServer(done);
    });
});
