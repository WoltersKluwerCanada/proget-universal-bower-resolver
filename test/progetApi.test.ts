"use strict";

import {expect} from "chai";
import ProgetAPI from "../src/progetApi";
import * as server from "./data/fake/fakeHtttpServer";
import * as share from "./data/share";

// Test the Request module methods
describe("progetApi", function() {
    before(function(done) {
        server.startServer(done);
        this.api = new ProgetAPI({
            config: share.bowerConfig,
            logger: {
                action: () => {
                    // No need to run anything here
                },
                conflict: () => {
                    // No need to run anything here
                },
                debug: () => {
                    // No need to run anything here
                },
                error: (id, message, data) => {
                    return `id: ${id}\nmessage: ${message}\ndata: ${data}`;
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
            },
            version: "0.0.0"
        });
    });

    // Test the isShortFormat method
    describe("isShortFormat", function() {
        it("shortName", function() {
            expect(ProgetAPI.isShortFormat("package")).to.be.true;
        });

        it("empty", function() {
            expect(ProgetAPI.isShortFormat("")).to.be.false;
        });

        it("long tool supported name", function() {
            expect(ProgetAPI.isShortFormat(`${share.testAddress}/upack/feedName`)).to.be.false;
        });

        it("long tool not supported name", function() {
            expect(ProgetAPI.isShortFormat("http://some.random.vwesite.fake/")).to.be.false;
        });
    });

    // Test the extractReleases method
    it("extractReleases", function() {
        const out = ProgetAPI.extractReleases(
            share.expectedRequestAnswer.forPkgInfo1,
            `${share.testAddress}/upack/feedName`
        );

        expect(out).eql([
            {
                target: `${share.testAddress}/upack/feedName#1.1.1`,
                version: "1.1.1"
            },
            {
                target: `${share.testAddress}/upack/feedName#2.2.2`,
                version: "2.2.2"
            }
        ]);
    });

    // checkForOldConfig
    // TODO this test

    // Test the isSupportedSource method
    describe("isSupportedSource", function() {
        it("supported", function() {
            expect(this.api.isSupportedSource(`${share.testAddress}/upack/feedName`)).to.be.true;
        });

        it("unsupported", function() {
            expect(this.api.isSupportedSource("https://bower.herokuapp.com")).to.be.false;
        });
    });

    // communicate
    // TODO this test

    it("findFeedId", function(done) {
        this.api.findFeedId(
            "http://localhost:8080/upack/feedName",
            () => {
                done();
            },
            (err) => {
                done(err);
            },
            {
                API_Key: share.testApiKey,
                Feed_Name: "feedName"
            }
        );
    });

    // Test request use at step releases
    describe("getPackageVersions", function() {
        it("package short name", function(done) {
            this.api.getPackageVersions("packageName").then(
                (rep) => {
                    try {
                        expect(rep.length).equal(4);
                        expect(rep).to.contain({
                            target: "http://localhost:8080/upack/42#1.1.1",
                            version: "1.1.1"
                        });
                        expect(rep).to.contain({
                            target: "http://localhost:8080/upack/42#3.3.3",
                            version: "3.3.3"
                        });
                        expect(rep).to.contain({
                            target: "http://localhost:8080/upack/23#1.1.1",
                            version: "1.1.1"
                        });
                        expect(rep).to.contain({
                            target: "http://localhost:8080/upack/23#2.2.2",
                            version: "2.2.2"
                        });
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

        it("url as package", function(done) {
            this.api.getPackageVersions(`${share.testAddress}/upack/42/download/bower/packageName/1.1.1`).then(
                (rep) => {
                    try {
                        expect(rep.length).equal(1);
                        expect(rep).to.contain({
                            target: "http://localhost:8080/upack/42#1.1.1",
                            version: "1.1.1"
                        });
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

        it("wrong formatted url", function(done) {
            this.api.getPackageVersions("https://bower.herokuapp.com").then(
                (rep) => {
                    try {
                        expect(rep.length).equal(0);
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

    // Test request use at step fetch
    it("Feeds_GetFeed by number", function(done) {
        this.api.getFeedDetails(`${share.testAddress}/upack/23`).then(
            (rep) => {
                try {
                    const serverData = JSON.parse(share.expectedRequestAnswer.forFeedInfo1);
                    expect(rep.description).equal(serverData.Feed_Description);
                    expect(rep.name).equal(serverData.Feed_Name);
                    expect(rep.id).equal(serverData.Feed_Id);
                    expect(rep.type).equal(serverData.FeedType_Name);
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

    // Test request use at step fetch
    it("Feeds_GetFeed by name", function(done) {
        this.api.getFeedDetails(`${share.testAddress}/upack/wk-develop-bower`).then(
            (rep) => {
                const serverData = JSON.parse(share.expectedRequestAnswer.forFeedInfo2);

                try {
                    expect(rep.description).equal(serverData.Feed_Description);
                    expect(rep.name).equal(serverData.Feed_Name);
                    expect(rep.id).equal(serverData.Feed_Id);
                    expect(rep.type).equal(serverData.FeedType_Name);
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

    after(function(done) {
        server.stopServer(done);
    });
});
