"use strict";

const chai = require("chai");
const expect = chai.expect;
const share = require("./data/share");
const server = require("./data/fakeHtttpServer");
const progetAPI = require("../lib/progetApi");

// Test the Request module methods
describe("proget.api.test", function() {
    before(function(done) {
        server.startServer(done);
        this.api = new progetAPI(share.bowerConfig);
    });

    // Test the extractReleases method
    it("extractReleases", function() {
        let out = progetAPI.extractReleases(share.expectedRequestAnswer.forPkgInfo1);

        expect(out).eql([
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
    });

    describe("ProGetPackages_GetPackages", function() {
        it("with feed id 1", function(done) {
            this.api.getPackagesSingle(`${share.testAddress}?23/bower/packageName`).then(
                (rep) => {
                    expect(rep.length).equal(2);
                    expect("1.1.1").equal(rep[0].Version_Text);
                    expect("2.2.2").equal(rep[1].Version_Text);
                    done();
                },
                (err) => {
                    done(err);
                }
            );
        });

        it("with feed name", function(done) {
            this.api.getPackagesSingle(`${share.testAddress}?wk-develop-bower/bower/packageName`).then(
                (rep) => {
                    expect(rep.length).equal(2);
                    expect("1.1.1").equal(rep[0].Version_Text);
                    expect("3.3.3").equal(rep[1].Version_Text);
                    done();
                },
                (err) => {
                    done(err);
                }
            );
        });
    });


    // Test request use at step releases
    describe("ProGetPackages_GetPackageVersions", function() {
        it("with feed id 1", function(done) {
            this.api.getPackageVersions(`${share.testAddress}?23/bower/packageName`).then(
                (rep) => {
                    expect(rep.length).equal(2);
                    expect("1.1.1").equal(rep[0].release).equal(rep[0].target).equal(rep[0].version);
                    expect("2.2.2").equal(rep[1].release).equal(rep[1].target).equal(rep[1].version);
                    done();
                },
                (err) => {
                    done(err);
                }
            );
        });

        it("with feed id 2", function(done) {
            this.api.getPackageVersions(`${share.testAddress}?42/bower/packageName`).then(
                (rep) => {
                    expect(rep.length).equal(2);
                    expect("1.1.1").equal(rep[0].release).equal(rep[0].target).equal(rep[0].version);
                    expect("3.3.3").equal(rep[1].release).equal(rep[1].target).equal(rep[1].version);
                    done();
                },
                (err) => {
                    done(err);
                }
            );
        });

        it("with feed name", function(done) {
            this.api.getPackageVersions(`${share.testAddress}?wk-develop-bower/bower/packageName`).then(
                (rep) => {
                    expect(rep.length).equal(2);
                    expect("1.1.1").equal(rep[0].release).equal(rep[0].target).equal(rep[0].version);
                    expect("3.3.3").equal(rep[1].release).equal(rep[1].target).equal(rep[1].version);
                    done();
                },
                (err) => {
                    done(err);
                }
            );
        });
        /*
         it("all versions", function(done) {
         this.api.getPackagesAllVersion("packageName").then(
         function(rep) {
         expect(rep.length).equal(3);
         expect("1.1.1").equal(rep[0].release).equal(rep[0].target).equal(rep[0].version);
         expect("2.2.2").equal(rep[1].release).equal(rep[1].target).equal(rep[1].version);
         expect("3.3.3").equal(rep[2].release).equal(rep[2].target).equal(rep[2].version);
         done();
         },
         function(err) {
         done(err);
         }
         );
         });
         */
    });

    // Test request use at step fetch
    it("Feeds_GetFeed by number", function(done) {
        this.api.getFeedDetails(`${share.testAddress}?23`).then(
            (rep) => {
                let serverData = JSON.parse(share.expectedRequestAnswer.forFeedInfo1);
                expect(rep.description).equal(serverData.Feed_Description);
                expect(rep.name).equal(serverData.Feed_Name);
                expect(rep.id).equal(serverData.Feed_Id);
                expect(rep.type).equal(serverData.FeedType_Name);
                done();
            },
            (err) => {
                done(err);
            }
        );
    });

    // Test request use at step fetch
    it("Feeds_GetFeed by name", function(done) {
        this.api.getFeedDetails(`${share.testAddress}?wk-develop-bower`).then(
            (rep) => {
                let serverData = JSON.parse(share.expectedRequestAnswer.forFeedInfo2);

                expect(rep.description).equal(serverData.Feed_Description);
                expect(rep.name).equal(serverData.Feed_Name);
                expect(rep.id).equal(serverData.Feed_Id);
                expect(rep.type).equal(serverData.FeedType_Name);
                done();
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
