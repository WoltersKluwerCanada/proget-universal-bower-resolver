"use strict";

const chai = require("chai");
const expect = chai.expect;
const share = require("./data/share");
const server = require("./data/fake/fakeHtttpServer");

const index = require("../lib/index")({
    config: share.bowerConfig,
    logger: {
        warn:(id, msg) => {console.log(`warn: ${id}: ${msg}`)},
        log:(id, msg) => {console.log(`log: ${id}: ${msg}`)},
        debug: (id, msg) => {console.log(`debug: ${id}: ${msg}`)}
    }
});

// Test the Main module methods
describe("index", function() {
    before(function(done) {
        server.startServer(done);
    });

    // Test the match method
    describe("match", function() {
        it("full matching url", function(done) {
            index.match(share.fullAddress).then(
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
        index.releases(`${share.testAddress}?feedName/bower/packageName`).then(
            (res) => {
                try {
                    expect(res).eql([
                        {
                            "target": "1.1.1",
                            "version": "1.1.1"
                        },
                        {
                            "target": "2.2.2",
                            "version": "2.2.2"
                        }
                    ]);
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

    // Test the fetch method
    describe("fetch", function() {
        let endpoint = {
            name: "packageName",
            target: `${share.testAddress}#1.1.1`,
            source: `${share.testAddress}/feedName/bower/packageName`,
            registry: true
        };

        // Try like if bower have not already the package in cache
        it("without cached version", function(done) {
            let cached = {
                endpoint: endpoint,
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
            let cached = {
                endpoint: endpoint,
                release: "1.1.1",
                version: "1.1.1",
                resolution: {}
            };

            let res = index.fetch(endpoint, cached);

            // If the method is ignore, it return undefined
            expect(res).be.a("undefined");
        });
    });

    after(function(done) {
        server.stopServer(done);
    });
});
