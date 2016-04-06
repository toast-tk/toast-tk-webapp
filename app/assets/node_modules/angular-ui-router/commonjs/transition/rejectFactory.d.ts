export declare enum RejectType {
    SUPERSEDED = 2,
    ABORTED = 3,
    INVALID = 4,
    IGNORED = 5,
}
export declare class TransitionRejection {
    type: number;
    message: string;
    detail: string;
    redirected: boolean;
    constructor(type: any, message: any, detail: any);
    toString(): string;
}
export declare class RejectFactory {
    constructor();
    superseded(detail?: any, options?: any): any;
    redirected(detail?: any): any;
    invalid(detail?: any): any;
    ignored(detail?: any): any;
    aborted(detail?: any): any;
}
