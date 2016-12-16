"use strict";
const ErrorN_1 = require("./ErrorN");
const createError = (msg, code, props) => {
    let err = new ErrorN_1.default(msg);
    err.code = code;
    if (props) {
        Object.assign(err, props);
    }
    return err;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createError;
