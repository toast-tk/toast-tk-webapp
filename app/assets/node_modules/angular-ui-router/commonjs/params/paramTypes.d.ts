export declare class ParamTypes {
    types: any;
    enqueue: boolean;
    typeQueue: any[];
    private defaultTypes;
    constructor();
    type(name: any, definition?: any, definitionFn?: Function): any;
    _flushTypeQueue(): void;
}
export declare let paramTypes: ParamTypes;
