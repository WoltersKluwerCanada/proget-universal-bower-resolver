declare interface IBowerLogger {
    error: (title: string, message: string, obj?: any) => void;
    conflict: (title: string, message: string, obj?: any) => void;
    warn: (title: string, message: string, obj?: any) => void;
    action: (title: string, message: string, obj?: any) => void;
    info: (title: string, message: string, obj?: any) => void;
    debug: (title: string, message: string, obj?: any) => void;
    log: (title: string, message: string, obj?: any) => void;
    prompt: (title: string, message: string, obj?: any) => void;
    pipe: (title: string, message: string, obj?: any) => void;
    geminate: (title: string, message: string, obj?: any) => void;
    intercept: (title: string, message: string, obj?: any) => void;
}
