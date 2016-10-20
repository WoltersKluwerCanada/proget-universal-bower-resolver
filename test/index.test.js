"use strict";

const chai = require("chai");
const expect = chai.expect;
const share = require("./data/share");
const server = require("./data/fakeHtttpServer");

const index = require("../lib/index")({config: share.bowerConfig});

// Test the Main module methods
describe("index", function() {
    before(function(done) {
        server.startServer(done);
    });

    // Test the match method
    describe("match", function() {
        it("full matching url", function() {
            let c = share.bowerConfig.proget;
            let url = c.registries[0].split("/upack/");
            expect(index.match(`${url[0]}/${url[1]}/bower/packageName`)).to.be.true;
        });

        describe("partial matching url", function() {
            it("package only", function(done) {
                index.match("packageName").then(
                    (data) => {
                        try {
                            expect(data).to.be.true;
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

        it("full not matching url", function() {
            expect(index.match("http://something-random.test")).to.be.false;
        });

        it("partial not matching url", function(done) {
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

    // Test the locate method
    describe("locate", function() {
        it("full source", function() {
            expect(index.locate("proget.test?feed/bower/packageName")).equal("proget.test?feed/bower/packageName");
        });

        it("full source from IP", function() {
            expect(index.locate("1.2.3.4?feed/bower/packageName")).equal("1.2.3.4?feed/bower/packageName");
        });
    });

    // Test the releases method
    it("releases", function(done) {
        index.releases(`${share.testAddress}?feedName/bower/packageName`).then(
            (res) => {
                try {
                    expect(res).eql([
                        {
                            "release": "1.1.1",
                            "target": "1.1.1",
                            "version": "1.1.1"
                        },
                        {
                            "release": "2.2.2",
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
            target: "1.1.1",
            source: `${share.testAddress}?feedName/bower/packageName`,
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
