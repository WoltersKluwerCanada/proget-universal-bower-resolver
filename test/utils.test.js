"use strict";

const chai = require("chai");
const expect = chai.expect;
const share = require("./data/share");

const utils = require("../lib/utils");

// Test the Utils module methods
describe("utils", () => {
    // Test the extractReleases method
    it("extractReleases", () => {
        let out = utils.extractReleases(share.expectedRequestAnswer.forPkgInfo);

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

    // Test the registryParser method
    describe("registryParser", () => {
        let c = share.bowerConfig.proget;

        describe("partial src", () => {
            it("package only", () => {
                expect(utils.registryParser("packageName", share.bowerConfig)).equal(`${c.server}?${c.feed}/${c.group || "bower"}/packageName`);
            });

            it("package and group", () => {
                expect(utils.registryParser("groupName/packageName", share.bowerConfig)).equal(`${c.server}?${c.feed}/groupName/packageName`);
            });

            it("feed, group and package", () => {
                expect(utils.registryParser("feed/groupName/packageName", share.bowerConfig)).equal(`${c.server}?feed/groupName/packageName`);
            });
        });

        it("full source", () => {
            expect(utils.registryParser("proget.test?feed/groupName/packageName", share.bowerConfig)).equal("proget.test?feed/groupName/packageName");
        });

        it("full source from IP", () => {
            expect(utils.registryParser("1.2.3.4?feed/groupName/packageName", share.bowerConfig)).equal("1.2.3.4?feed/groupName/packageName");
        });
    });
});