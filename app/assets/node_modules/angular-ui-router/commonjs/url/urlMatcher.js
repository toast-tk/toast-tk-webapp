"use strict";
/** @module url */ /** for typedoc */
var common_1 = require("../common/common");
var hof_1 = require("../common/hof");
var predicates_1 = require("../common/predicates");
var module_1 = require("../params/module");
var predicates_2 = require("../common/predicates");
var param_1 = require("../params/param");
var common_2 = require("../common/common");
var common_3 = require("../common/common");
function quoteRegExp(string, param) {
    var surroundPattern = ['', ''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
    if (!param)
        return result;
    switch (param.squash) {
        case false:
            surroundPattern = ['(', ')' + (param.isOptional ? '?' : '')];
            break;
        case true:
            result = result.replace(/\/$/, '');
            surroundPattern = ['(?:\/(', ')|\/)?'];
            break;
        default:
            surroundPattern = [("(" + param.squash + "|"), ')?'];
            break;
    }
    return result + surroundPattern[0] + param.type.pattern.source + surroundPattern[1];
}
var memoizeTo = function (obj, prop, fn) { return obj[prop] = obj[prop] || fn(); };
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
var UrlMatcher = (function () {
    function UrlMatcher(pattern, config) {
        var _this = this;
        this.pattern = pattern;
        this.config = config;
        this._cache = { path: [], pattern: null };
        this._children = [];
        this._params = [];
        this._segments = [];
        this._compiled = [];
        this.config = common_1.defaults(this.config, {
            params: {},
            strict: true,
            caseInsensitive: false,
            paramMap: common_1.identity
        });
        // Find all placeholders and create a compiled pattern, using either classic or curly syntax:
        //   '*' name
        //   ':' name
        //   '{' name '}'
        //   '{' name ':' regexp '}'
        // The regular expression is somewhat complicated due to the need to allow curly braces
        // inside the regular expression. The placeholder regexp breaks down as follows:
        //    ([:*])([\w\[\]]+)              - classic placeholder ($1 / $2) (search version has - for snake-case)
        //    \{([\w\[\]]+)(?:\:\s*( ... ))?\}  - curly brace placeholder ($3) with optional regexp/type ... ($4) (search version has - for snake-case
        //    (?: ... | ... | ... )+         - the regexp consists of any number of atoms, an atom being either
        //    [^{}\\]+                       - anything other than curly braces or backslash
        //    \\.                            - a backslash escape
        //    \{(?:[^{}\\]+|\\.)*\}          - a matched set of curly braces containing other atoms
        var placeholder = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g, searchPlaceholder = /([:]?)([\w\[\].-]+)|\{([\w\[\].-]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g, last = 0, m, patterns = [];
        var checkParamErrors = function (id) {
            if (!UrlMatcher.nameValidator.test(id))
                throw new Error("Invalid parameter name '" + id + "' in pattern '" + pattern + "'");
            if (common_1.find(_this._params, hof_1.propEq('id', id)))
                throw new Error("Duplicate parameter name '" + id + "' in pattern '" + pattern + "'");
        };
        // Split into static segments separated by path parameter placeholders.
        // The number of segments is always 1 more than the number of parameters.
        var matchDetails = function (m, isSearch) {
            // IE[78] returns '' for unmatched groups instead of null
            var id = m[2] || m[3], regexp = isSearch ? m[4] : m[4] || (m[1] === '*' ? '.*' : null);
            return {
                id: id,
                regexp: regexp,
                cfg: _this.config.params[id],
                segment: pattern.substring(last, m.index),
                type: !regexp ? null : module_1.paramTypes.type(regexp || "string") || common_1.inherit(module_1.paramTypes.type("string"), {
                    pattern: new RegExp(regexp, _this.config.caseInsensitive ? 'i' : undefined)
                })
            };
        };
        var p, segment;
        while ((m = placeholder.exec(pattern))) {
            p = matchDetails(m, false);
            if (p.segment.indexOf('?') >= 0)
                break; // we're into the search part
            checkParamErrors(p.id);
            this._params.push(module_1.Param.fromPath(p.id, p.type, this.config.paramMap(p.cfg, false)));
            this._segments.push(p.segment);
            patterns.push([p.segment, common_1.tail(this._params)]);
            last = placeholder.lastIndex;
        }
        segment = pattern.substring(last);
        // Find any search parameter names and remove them from the last segment
        var i = segment.indexOf('?');
        if (i >= 0) {
            var search = segment.substring(i);
            segment = segment.substring(0, i);
            if (search.length > 0) {
                last = 0;
                while ((m = searchPlaceholder.exec(search))) {
                    p = matchDetails(m, true);
                    checkParamErrors(p.id);
                    this._params.push(module_1.Param.fromSearch(p.id, p.type, this.config.paramMap(p.cfg, true)));
                    last = placeholder.lastIndex;
                }
            }
        }
        this._segments.push(segment);
        common_1.extend(this, {
            _compiled: patterns.map(function (pattern) { return quoteRegExp.apply(null, pattern); }).concat(quoteRegExp(segment)),
            prefix: this._segments[0]
        });
        Object.freeze(this);
    }
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
    UrlMatcher.prototype.append = function (url) {
        this._children.push(url);
        common_1.forEach(url._cache, function (val, key) { return url._cache[key] = predicates_1.isArray(val) ? [] : null; });
        url._cache.path = this._cache.path.concat(this);
        return url;
    };
    UrlMatcher.prototype.isRoot = function () {
        return this._cache.path.length === 0;
    };
    UrlMatcher.prototype.toString = function () {
        return this.pattern;
    };
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
    UrlMatcher.prototype.exec = function (path, search, hash, options) {
        var _this = this;
        if (search === void 0) { search = {}; }
        if (options === void 0) { options = {}; }
        var match = memoizeTo(this._cache, 'pattern', function () {
            return new RegExp([
                '^',
                common_1.unnest(_this._cache.path.concat(_this).map(hof_1.prop('_compiled'))).join(''),
                _this.config.strict === false ? '\/?' : '',
                '$'
            ].join(''), _this.config.caseInsensitive ? 'i' : undefined);
        }).exec(path);
        if (!match)
            return null;
        //options = defaults(options, { isolate: false });
        var allParams = this.parameters(), pathParams = allParams.filter(function (param) { return !param.isSearch(); }), searchParams = allParams.filter(function (param) { return param.isSearch(); }), nPathSegments = this._cache.path.concat(this).map(function (urlm) { return urlm._segments.length - 1; }).reduce(function (a, x) { return a + x; }), values = {};
        if (nPathSegments !== match.length - 1)
            throw new Error("Unbalanced capture group in route '" + this.pattern + "'");
        function decodePathArray(string) {
            var reverseString = function (str) { return str.split("").reverse().join(""); };
            var unquoteDashes = function (str) { return str.replace(/\\-/g, "-"); };
            var split = reverseString(string).split(/-(?!\\)/);
            var allReversed = common_1.map(split, reverseString);
            return common_1.map(allReversed, unquoteDashes).reverse();
        }
        for (var i = 0; i < nPathSegments; i++) {
            var param = pathParams[i];
            var value = match[i + 1];
            // if the param value matches a pre-replace pair, replace the value before decoding.
            for (var j = 0; j < param.replace.length; j++) {
                if (param.replace[j].from === value)
                    value = param.replace[j].to;
            }
            if (value && param.array === true)
                value = decodePathArray(value);
            if (predicates_2.isDefined(value))
                value = param.type.decode(value);
            values[param.id] = param.value(value);
        }
        common_1.forEach(searchParams, function (param) {
            var value = search[param.id];
            for (var j = 0; j < param.replace.length; j++) {
                if (param.replace[j].from === value)
                    value = param.replace[j].to;
            }
            if (predicates_2.isDefined(value))
                value = param.type.decode(value);
            values[param.id] = param.value(value);
        });
        if (hash)
            values["#"] = hash;
        return values;
    };
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
    UrlMatcher.prototype.parameters = function (opts) {
        if (opts === void 0) { opts = {}; }
        if (opts.inherit === false)
            return this._params;
        return common_1.unnest(this._cache.path.concat(this).map(hof_1.prop('_params')));
    };
    UrlMatcher.prototype.parameter = function (id, opts) {
        if (opts === void 0) { opts = {}; }
        var parent = common_1.tail(this._cache.path);
        return (common_1.find(this._params, hof_1.propEq('id', id)) ||
            (opts.inherit !== false && parent && parent.parameter(id)) ||
            null);
    };
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
    UrlMatcher.prototype.validates = function (params) {
        var _this = this;
        var validParamVal = function (param, val) { return !param || param.validates(val); };
        return common_1.pairs(params || {}).map(function (_a) {
            var key = _a[0], val = _a[1];
            return validParamVal(_this.parameter(key), val);
        }).reduce(common_1.allTrueR, true);
    };
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
    UrlMatcher.prototype.format = function (values) {
        if (values === void 0) { values = {}; }
        if (!this.validates(values))
            return null;
        // Build the full path of UrlMatchers (including all parent UrlMatchers)
        var urlMatchers = this._cache.path.slice().concat(this);
        // Extract all the static segments and Params into an ordered array
        var pathSegmentsAndParams = urlMatchers.map(UrlMatcher.pathSegmentsAndParams).reduce(common_2.unnestR, []);
        // Extract the query params into a separate array
        var queryParams = urlMatchers.map(UrlMatcher.queryParams).reduce(common_2.unnestR, []);
        /**
         * Given a Param,
         * Applies the parameter value, then returns details about it
         */
        function getDetails(param) {
            // Normalize to typed value
            var value = param.value(values[param.id]);
            var isDefaultValue = param.isDefaultValue(value);
            // Check if we're in squash mode for the parameter
            var squash = isDefaultValue ? param.squash : false;
            // Allow the Parameter's Type to encode the value
            var encoded = param.type.encode(value);
            return { param: param, value: value, isDefaultValue: isDefaultValue, squash: squash, encoded: encoded };
        }
        // Build up the path-portion from the list of static segments and parameters
        var pathString = pathSegmentsAndParams.reduce(function (acc, x) {
            // The element is a static segment (a raw string); just append it
            if (predicates_1.isString(x))
                return acc + x;
            // Otherwise, it's a Param.  Fetch details about the parameter value
            var _a = getDetails(x), squash = _a.squash, encoded = _a.encoded, param = _a.param;
            // If squash is === true, try to remove a slash from the path
            if (squash === true)
                return (acc.match(/\/$/)) ? acc.slice(0, -1) : acc;
            // If squash is a string, use the string for the param value
            if (predicates_1.isString(squash))
                return acc + squash;
            if (squash !== false)
                return acc; // ?
            if (encoded == null)
                return acc;
            // If this parameter value is an array, encode the value using encodeDashes
            if (predicates_1.isArray(encoded))
                return acc + common_1.map(encoded, UrlMatcher.encodeDashes).join("-");
            // If the parameter type is "raw", then do not encodeURIComponent
            if (param.type.raw)
                return acc + encoded;
            // Encode the value
            return acc + encodeURIComponent(encoded);
        }, "");
        // Build the query string by applying parameter values (array or regular)
        // then mapping to key=value, then flattening and joining using "&"
        var queryString = queryParams.map(function (param) {
            var _a = getDetails(param), squash = _a.squash, encoded = _a.encoded, isDefaultValue = _a.isDefaultValue;
            if (encoded == null || (isDefaultValue && squash !== false))
                return;
            if (!predicates_1.isArray(encoded))
                encoded = [encoded];
            if (encoded.length === 0)
                return;
            if (!param.type.raw)
                encoded = common_1.map(encoded, encodeURIComponent);
            return encoded.map(function (val) { return (param.id + "=" + val); });
        }).filter(common_1.identity).reduce(common_2.unnestR, []).join("&");
        // Concat the pathstring with the queryString (if exists) and the hashString (if exists)
        return pathString + (queryString ? "?" + queryString : "") + (values["#"] ? "#" + values["#"] : "");
    };
    UrlMatcher.encodeDashes = function (str) {
        return encodeURIComponent(str).replace(/-/g, function (c) { return ("%5C%" + c.charCodeAt(0).toString(16).toUpperCase()); });
    };
    /** Given a matcher, return an array with the matcher's path segments and path params, in order */
    UrlMatcher.pathSegmentsAndParams = function (matcher) {
        var staticSegments = matcher._segments;
        var pathParams = matcher._params.filter(function (p) { return p.location === param_1.DefType.PATH; });
        return common_3.arrayTuples(staticSegments, pathParams.concat(undefined)).reduce(common_2.unnestR, []).filter(function (x) { return x !== "" && predicates_2.isDefined(x); });
    };
    /** Given a matcher, return an array with the matcher's query params */
    UrlMatcher.queryParams = function (matcher) {
        return matcher._params.filter(function (p) { return p.location === param_1.DefType.SEARCH; });
    };
    UrlMatcher.nameValidator = /^\w+([-.]+\w+)*(?:\[\])?$/;
    return UrlMatcher;
}());
exports.UrlMatcher = UrlMatcher;
//# sourceMappingURL=urlMatcher.js.map