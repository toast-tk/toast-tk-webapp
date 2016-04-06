import { Param } from "../params/module";
/**
 * @ngdoc object
 * @name ui.router.util.type:UrlMatcher
 *
 * @description
 * Matches URLs against patterns and extracts named parameters from the path or the search
 * part of the URL. A URL pattern consists of a path pattern, optionally followed by '?' and a list
 * of search parameters. Multiple search parameter names are separated by '&'. Search parameters
 * do not influence whether or not a URL is matched, but their values are passed through into
 * the matched parameters returned by {@link ui.router.util.type:UrlMatcher#methods_exec exec}.
 *
 * Path parameter placeholders can be specified using simple colon/catch-all syntax or curly brace
 * syntax, which optionally allows a regular expression for the parameter to be specified:
 *
 * * `':'` name - colon placeholder
 * * `'*'` name - catch-all placeholder
 * * `'{' name '}'` - curly placeholder
 * * `'{' name ':' regexp|type '}'` - curly placeholder with regexp or type name. Should the
 *   regexp itself contain curly braces, they must be in matched pairs or escaped with a backslash.
 *
 * Parameter names may contain only word characters (latin letters, digits, and underscore) and
 * must be unique within the pattern (across both path and search parameters). For colon
 * placeholders or curly placeholders without an explicit regexp, a path parameter matches any
 * number of characters other than '/'. For catch-all placeholders the path parameter matches
 * any number of characters.
 *
 * Examples:
 *
 * * `'/hello/'` - Matches only if the path is exactly '/hello/'. There is no special treatment for
 *   trailing slashes, and patterns have to match the entire path, not just a prefix.
 * * `'/user/:id'` - Matches '/user/bob' or '/user/1234!!!' or even '/user/' but not '/user' or
 *   '/user/bob/details'. The second path segment will be captured as the parameter 'id'.
 * * `'/user/{id}'` - Same as the previous example, but using curly brace syntax.
 * * `'/user/{id:[^/]*}'` - Same as the previous example.
 * * `'/user/{id:[0-9a-fA-F]{1,8}}'` - Similar to the previous example, but only matches if the id
 *   parameter consists of 1 to 8 hex digits.
 * * `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
 *   path into the parameter 'path'.
 * * `'/files/*path'` - ditto.
 * * `'/calendar/{start:date}'` - Matches "/calendar/2014-11-12" (because the pattern defined
 *   in the built-in  `date` Type matches `2014-11-12`) and provides a Date object in $stateParams.start
 *
 * @param {string} pattern  The pattern to compile into a matcher.
 * @param {Object} config  A configuration object hash
 * * `caseInsensitive` - `true` if URL matching should be case insensitive, otherwise `false`, the default value (for backward compatibility) is `false`.
 * * `strict` - `false` if matching against a URL with a trailing slash should be treated as equivalent to a URL without a trailing slash, the default value is `true`.
 *
 * @property {string} prefix  A static prefix of this pattern. The matcher guarantees that any
 *   URL matching this matcher (i.e. any string for which {@link ui.router.util.type:UrlMatcher#methods_exec exec()} returns
 *   non-null) will start with this prefix.
 *
 * @property {string} pattern  The pattern that was passed into the constructor
 *
 * @returns {Object}  New `UrlMatcher` object
 */
export declare class UrlMatcher {
    pattern: string;
    config: any;
    static nameValidator: RegExp;
    private _cache;
    private _children;
    private _params;
    private _segments;
    private _compiled;
    prefix: string;
    constructor(pattern: string, config: any);
    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#append
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * @TODO
     *
     * @example
     * @TODO
     *
     * @param {UrlMatcher} url A `UrlMatcher` instance to append as a child of the current `UrlMatcher`.
     */
    append(url: UrlMatcher): UrlMatcher;
    isRoot(): boolean;
    toString(): string;
    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#exec
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Tests the specified path against this matcher, and returns an object containing the captured
     * parameter values, or null if the path does not match. The returned object contains the values
     * of any search parameters that are mentioned in the pattern, but their value may be null if
     * they are not present in `search`. This means that search parameters are always treated
     * as optional.
     *
     * @example
     * <pre>
     * new UrlMatcher('/user/{id}?q&r').exec('/user/bob', {
     *   x: '1', q: 'hello'
     * });
     * // returns { id: 'bob', q: 'hello', r: null }
     * </pre>
     *
     * @param {string} path  The URL path to match, e.g. `$location.path()`.
     * @param {Object} search  URL search parameters, e.g. `$location.search()`.
     * @param {string} hash  URL hash e.g. `$location.hash()`.
     * @param {Object} options
     * @returns {Object}  The captured parameter values.
     */
    exec(path: string, search?: any, hash?: string, options?: any): {};
    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#parameters
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Returns the names of all path and search parameters of this pattern in order of appearance.
     *
     * @returns {Array.<Param>}  An array of [[Param]] objects. Must be treated as read-only. If the
     *    pattern has no parameters, an empty array is returned.
     */
    parameters(opts?: any): Param[];
    parameter(id: string, opts?: any): Param;
    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#validates
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Checks an object hash of parameters to validate their correctness according to the parameter
     * types of this `UrlMatcher`.
     *
     * @param {Object} params The object hash of parameters to validate.
     * @returns {boolean} Returns `true` if `params` validates, otherwise `false`.
     */
    validates(params: any): boolean;
    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#format
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Creates a URL that matches this pattern by substituting the specified values
     * for the path and search parameters. Null values for path parameters are
     * treated as empty strings.
     *
     * @example
     * <pre>
     * new UrlMatcher('/user/{id}?q').format({ id:'bob', q:'yes' });
     * // returns '/user/bob?q=yes'
     * </pre>
     *
     * @param {Object} values  the values to substitute for the parameters in this pattern.
     * @returns {string}  the formatted URL (path and optionally search part).
     */
    format(values?: {}): string;
    static encodeDashes(str: any): string;
    /** Given a matcher, return an array with the matcher's path segments and path params, in order */
    static pathSegmentsAndParams(matcher: UrlMatcher): any;
    /** Given a matcher, return an array with the matcher's query params */
    static queryParams(matcher: UrlMatcher): Param[];
}
