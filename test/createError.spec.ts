"use strict";

/* tslint:disable:only-arrow-functions no-unused-expression */

import {expect} from "chai";
import createError from "../src/createError";

// Test the CreateError module methods
describe("createError", function() {
    // Test with only the minimal information
    it("basic information", function() {
        const err = createError("Some test text!", "ETEST");

        expect(err.code).equal("ETEST");
        expect(err).a("Error");
    });

    // Test with some extra information
    it("advance information", function() {
        const err = createError("Some test text!", "ETEST", {
            details: "Some test details."
        });

        expect(err.code).equal("ETEST");
        expect(err.details).equal("Some test details.");
        expect(err).a("Error");
    });
});
