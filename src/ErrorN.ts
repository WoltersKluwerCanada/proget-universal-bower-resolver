"use strict";

class ErrorN extends Error {
    public code: string;
    [key: string]: string;
}

export default ErrorN;
