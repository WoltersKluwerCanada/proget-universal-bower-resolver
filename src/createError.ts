"use strict";

/**
 * CreateError module.
 * @module createError
 */

import ErrorN from "./ErrorN";

/**
 * Create an error
 *
 * @param {string} msg - Error message
 * @param {string} code - Error code, Node.js style ex: https://nodejs.org/api/errors.html#errors_common_system_errors
 * @param {{}} [props] - Error properties
 * @return {ErrorN}
 */
const createError = (msg: string, code: string, props?: Object): ErrorN => {
    let err: ErrorN = new ErrorN(msg);
    err.code = code;

    if (props) {
        Object.assign(err, props);
    }

    return err;
};

export default createError;
