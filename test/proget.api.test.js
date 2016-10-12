"use strict";

const chai = require("chai");
const expect = chai.expect;
const share = require("./data/share");
const server = require("./data/fakeHtttpServer");
const proget = require("../lib/progetApi");

// Test the Request module methods
describe("proget.api.test", () => {
    before((done) => {
        server.startServer(done);
        this.api = proget.createApi(share.bowerConfig);
    });

    // Test the extractReleases method
    it("extractReleases", () => {
        let out = this.api.extractReleases(share.expectedRequestAnswer.forPkgInfo);

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
    
    // Test request use at step releases
    describe("ProGetPackages_GetPackageVersions", () => {
        it("with feed id", (done) => {
            this.api.getPackageVersions(`${share.testAddress}?23/groupName/packageName`).then(
                function(rep) {
                    expect(rep.length).equal(2);
                    expect("1.1.1").equal(rep[0].release).equal(rep[0].version).equal(rep[0].version);
                    expect("2.2.2").equal(rep[1].release).equal(rep[1].version).equal(rep[1].version);
                    done();
                },
                function(err) {
                    done(err);
                }
            );
        });

        it("with feed name", (done) => {
            this.api.getPackageVersions(`${share.testAddress}?feedName/groupName/packageName`).then(
                function(rep) {
                    expect(rep.length).equal(2);
                    expect("1.1.1").equal(rep[0].release).equal(rep[0].version).equal(rep[0].version);
                    expect("2.2.2").equal(rep[1].release).equal(rep[1].version).equal(rep[1].version);
                    done();
                },
                function(err) {
                    done(err);
                }
            );
        });
    });

    // Test request use at step fetch
    it("Feeds_GetFeed", (done) => {
        this.api.getFeedDetails(`${share.testAddress}?23`).then(
            function(rep) {
                let serverData = JSON.parse(share.expectedRequestAnswer.forFeedInfo);
                expect(rep.description).equal(serverData.Feed_Description);
                expect(rep.name).equal(serverData.Feed_Name);
                expect(rep.id).equal(serverData.Feed_Id);
                expect(rep.type).equal(serverData.FeedType_Name);
                done();
            },
            function(err) {
                done(err);
            }
        );
    });

    after((done) => {
        server.stopServer(done);
    });
});