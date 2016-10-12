"use strict";

const chai = require("chai");
const expect = chai.expect;
const share = require("./data/share");

const utils = require("../lib/utils");

// Test the Utils module methods
describe("utils", () => {
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