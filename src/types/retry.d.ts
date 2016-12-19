declare module 'retry' {
// Type definitions for retry v0.10.1
// Project: https://www.npmjs.com/package/retry
// Definitions by: Tim Koschützki <tim@debuggable.com>

    interface TimeoutsOptions {
        retries?: number;
        factor?: number;
        minTimeout?: number;
        maxTimeout?: number;
        randomize?: boolean;
    }

    interface OperationOptions extends TimeoutsOptions {
        forever?: boolean;
        unref?: boolean;
    }

    class Timeouts {
        constructor(attempt: number, opts: TimeoutsOptions);
    }

    class RetryOperation {
        constructor(timeouts: Timeouts[], options: OperationOptions|boolean);

        error(): Error[];

        mainError(): Error|null;

        attempt(fn: Function, timeoutOps?: Object): void;

        retry(error?: Error): boolean;

        stop(): void;

        attempts(): number;
    }

    namespace retry {
        function operation(options?: OperationOptions): RetryOperation;
    }

    export = retry;
}
