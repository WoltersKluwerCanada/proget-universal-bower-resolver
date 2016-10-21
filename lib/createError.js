"use strict";

/**
 * CreateError module.
 * @module createError
 */

const mout = require("mout");

/**
 * Create an error
 *
 * @param {string} msg - The Error message
 * @param {string} code - The error code Node.js style ex: https://nodejs.org/api/errors.html#errors_common_system_errors
 * @param {{}} [props] - Error properties
 * @return {Error}
 */
function createError(msg, code, props) {
    let err = new Error(msg);
    err.code = code;

    if (props) {
        mout.object.mixIn(err, props);
    }

    return err;
}

module.exports = createError;
