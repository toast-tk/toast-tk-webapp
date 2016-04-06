import { TypeDefinition } from "./interface";
/**
 * Implements an interface to define custom parameter types that can be decoded from and encoded to
 * string parameters matched in a URL. Used by [[UrlMatcher]]
 * objects when matching or formatting URLs, or comparing or validating parameter values.
 *
 * See [[UrlMatcherFactory.type]] for more information on registering custom types.
 *
 * @example
 * ```
 *
 * {
 *   decode: function(val) { return parseInt(val, 10); },
 *   encode: function(val) { return val && val.toString(); },
 *   equals: function(a, b) { return this.is(a) && a === b; },
 *   is: function(val) { return angular.isNumber(val) && isFinite(val) && val % 1 === 0; },
 *   pattern: /\d+/
 * }
 * ```
 */
export declare class Type implements TypeDefinition {
    pattern: RegExp;
    name: string;
    raw: boolean;
    /**
     * @param def  A configuration object which contains the custom type definition.  The object's
     *        properties will override the default methods and/or pattern in `Type`'s public interface.
     * @returns a new Type object
     */
    constructor(def: TypeDefinition);
    /** @inheritdoc */
    is(val: any, key?: string): boolean;
    /** @inheritdoc */
    encode(val: any, key?: string): (string | string[]);
    /** @inheritdoc */
    decode(val: string, key?: string): any;
    /** @inheritdoc */
    equals(a: any, b: any): boolean;
    $subPattern(): string;
    toString(): string;
    /** Given an encoded string, or a decoded object, returns a decoded object */
    $normalize(val: any): any;
    /**
     * Wraps an existing custom Type as an array of Type, depending on 'mode'.
     * e.g.:
     * - urlmatcher pattern "/path?{queryParam[]:int}"
     * - url: "/path?queryParam=1&queryParam=2
     * - $stateParams.queryParam will be [1, 2]
     * if `mode` is "auto", then
     * - url: "/path?queryParam=1 will create $stateParams.queryParam: 1
     * - url: "/path?queryParam=1&queryParam=2 will create $stateParams.queryParam: [1, 2]
     */
    $asArray(mode: any, isSearch: any): any;
}
