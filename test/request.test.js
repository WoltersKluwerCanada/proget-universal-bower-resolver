"use strict";

const chai = require("chai");
const expect = chai.expect;
const share = require("./data/share");
const server = require("./data/fakeHtttpServer");

const request = require("../lib/request");

// Test the Request module methods
describe("request", () => {
    before((done) => {
        server.startServer(done);
    });

    // Test request use at step releases
    describe("ProGetPackages_GetPackageVersions", () => {
        it("with feed id", (done) => {
            request(`${share.testAddress}?23/groupName/packageName`, "ProGetPackages_GetPackageVersions", share.bowerConfig).then(
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
            request(`${share.testAddress}?feedName/groupName/packageName`, "ProGetPackages_GetPackageVersions", share.bowerConfig).then(
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
        request(`${share.testAddress}?23`, "Feeds_GetFeed", share.bowerConfig).then(
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