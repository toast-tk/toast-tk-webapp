export declare const isUndefined: (x: any) => boolean;
export declare const isDefined: (...args: any[]) => boolean;
export declare const isNull: (o: any) => boolean;
export declare const isFunction: (x: any) => boolean;
export declare const isNumber: (x: any) => boolean;
export declare const isString: (x: any) => boolean;
export declare const isObject: (x: any) => boolean;
export declare const isArray: (arg: any) => arg is any[];
export declare const isDate: (x: any) => boolean;
export declare const isRegExp: (x: any) => boolean;
/**
 * Predicate which checks if a value is injectable
 *
 * A value is "injectable" if it is a function, or if it is an ng1 array-notation-style array
 * where all the elements in the array are Strings, except the last one, which is a Function
 */
export declare function isInjectable(val: any): boolean;
/**
 * Predicate which checks if a value looks like a Promise
 *
 * It is probably a Promise if it's an object, and it has a `then` property which is a Function
 */
export declare const isPromise: Function;
