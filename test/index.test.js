"use strict";

const chai = require("chai");
const expect = chai.expect;
const share = require("./data/share");
const server = require("./data/fakeHtttpServer");

const index = require("../lib/index")({config: share.bowerConfig});

// Test the Main module methods
describe("index", () => {
    before((done) => {
        server.startServer(done);
    });

    // Test the match method
    describe("match", () => {
        it("full matching url", () => {
            let c = share.bowerConfig.proget;
            let url = c.registries[0].split("/upack/");
            expect(index.match(`${url[0]}/${url[1]}/bower/packageName`)).to.be.true;
        });

        describe("partial matching url", () => {
            it("package only", (done) => {
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

        it("full not matching url", () => {
            expect(index.match("http://something-random.test")).to.be.false;
        });

        it("partial not matching url", (done) => {
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
    describe("locate", () => {
        let c = share.bowerConfig.proget;
        let url = c.registries[0].split("/upack/");

        it("full source", ()=> {
            expect(index.locate("proget.test?feed/bower/packageName")).equal("proget.test?feed/bower/packageName");
        });

        it("full source from IP", ()=> {
            expect(index.locate("1.2.3.4?feed/bower/packageName")).equal("1.2.3.4?feed/bower/packageName");
        });
    });

    // Test the releases method
    it("releases", (done) => {
        index.releases(`${share.testAddress}?feedName/bower/packageName`).then(
            function (res) {
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
            function (err) {
                done(err);
            }
        );
    });

    // Test the fetch method
    describe("fetch", () => {
        let endpoint = {
            name: "packageName",
            target: "1.1.1",
            source: `${share.testAddress}?feedName/bower/packageName`,
            registry: true
        };

        // Try like if bower have not already the package in cache
        it("without cached version", (done) => {
            let cached = {
                endpoint: endpoint,
                release: "1.1.1",
                resolution: {}
            };

            index.fetch(endpoint, cached).then(
                function (res) {
                    expect(res.hasOwnProperty("tempPath")).to.be.true;
                    expect(res.hasOwnProperty("removeIgnores")).to.be.true;

                    done();
                },
                function (err) {
                    done(err);
                }
            );
        });

        // Try like if bower already have the package in cache
        it("with version in cache", () => {
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

    after((done) => {
        server.stopServer(done);
    });
});