"use strict";

const chai = require("chai");
const expect = chai.expect;

const createError = require("../lib/createError").default;

// Test the CreateError module methods
describe("createError", function() {
    // Test with only the minimal information
    it("basic information", function() {
        let err = createError("Some test text!", "ETEST");

        expect(err).eql({"code": "ETEST"});
        expect(err).a("Error");
    });

    // Test with some extra information
    it("advance information", function() {
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
