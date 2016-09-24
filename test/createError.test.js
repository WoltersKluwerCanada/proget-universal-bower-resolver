"use strict";

const chai = require("chai");
const expect = chai.expect;

const createError = require("../lib/createError");

// Test the CreateError module methods
describe("createError", () => {
    // Test with only the minimal information
    it("basic information", () => {
        let err = createError("Some test text!", "ETEST");

        expect(err).eql({"code": "ETEST"});
        expect(err).a("Error");
    });

    // Test with some extra information
    it("advance information", () => {
        let err = createError("Some test text!", "ETEST", {
            details: "Some test details."
        });

        expect(err).eql({
            "code": "ETEST",
            "details": "Some test details."
        });
        expect(err).a("Error");
    });
});