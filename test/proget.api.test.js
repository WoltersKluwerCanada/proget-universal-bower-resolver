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

    // Test request use at step releases
    describe("ProGetPackages_GetPackageVersions", () => {
        it("with feed id", (done) => {
            this.api.getPackageVersions(`${share.testAddress}?23/groupName/packageName`).then(
                function(rep) {
                    expect(rep).equal(share.expectedRequestAnswer.forPkgInfo);
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
                    expect(rep).equal(share.expectedRequestAnswer.forPkgInfo);
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
        this.api.getFeeds(`${share.testAddress}?23`).then(
            function(rep) {
                expect(rep).equal(share.expectedRequestAnswer.forFeedInfo);
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