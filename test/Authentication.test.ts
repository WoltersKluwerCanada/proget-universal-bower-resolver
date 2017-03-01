"use strict";

import {expect} from "chai";
import * as path from "path";
import Authentication from "../src/Authentication";

// Test the CreateError module methods
describe("Authentication", function() {
    // Test with only the minimal information
    it("with local .npmrc and auth information", function() {
        const auth = Authentication.getInstance();

        auth.cwd = path.join(__dirname, "data");

        expect(auth.getCredentialsByURI("http://localhost/npm/")).eql({password: "banana", username: "testMan"});
    });
});
