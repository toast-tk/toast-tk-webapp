/** @module common_strings */ /** */
"use strict";
var predicates_1 = require("./predicates");
var rejectFactory_1 = require("../transition/rejectFactory");
var common_1 = require("./common");
var hof_1 = require("./hof");
var transition_1 = require("../transition/transition");
var resolvable_1 = require("../resolve/resolvable");
/**
 * Returns a string shortened to a maximum length
 *
 * If the string is already less than the `max` length, return the string.
 * Else return the string, shortened to `max - 3` and append three dots ("...").
 *
 * @param max the maximum length of the string to return
 * @param str the input string
 */
function maxLength(max, str) {
    if (str.length <= max)
        return str;
    return str.substr(0, max - 3) + "...";
}
exports.maxLength = maxLength;
/**
 * Returns a string, with spaces added to the end, up to a desired str length
 *
 * If the string is already longer than the desired length, return the string.
 * Else returns the string, with extra spaces on the end, such that it reaches `length` characters.
 *
 * @param length the desired length of the string to return
 * @param str the input string
 */
function padString(length, str) {
    while (str.length < length)
        str += " ";
    return str;
}
exports.padString = padString;
exports.kebobString = function (camelCase) { return camelCase.replace(/([A-Z])/g, function ($1) { return "-" + $1.toLowerCase(); }); };
function _toJson(obj) {
    return JSON.stringify(obj);
}
function _fromJson(json) {
    return predicates_1.isString(json) ? JSON.parse(json) : json;
}
function promiseToString(p) {
    if (hof_1.is(rejectFactory_1.TransitionRejection)(p.reason))
        return p.reason.toString();
    return "Promise(" + JSON.stringify(p) + ")";
}
function functionToString(fn) {
    var fnStr = fnToString(fn);
    var namedFunctionMatch = fnStr.match(/^(function [^ ]+\([^)]*\))/);
    return namedFunctionMatch ? namedFunctionMatch[1] : fnStr;
}
exports.functionToString = functionToString;
function fnToString(fn) {
    var _fn = predicates_1.isArray(fn) ? fn.slice(-1)[0] : fn;
    return _fn && _fn.toString() || "undefined";
}
exports.fnToString = fnToString;
var stringifyPattern = hof_1.pattern([
    [hof_1.not(predicates_1.isDefined), hof_1.val("undefined")],
    [predicates_1.isNull, hof_1.val("null")],
    [predicates_1.isPromise, promiseToString],
    [hof_1.is(transition_1.Transition), hof_1.invoke("toString")],
    [hof_1.is(resolvable_1.Resolvable), hof_1.invoke("toString")],
    [predicates_1.isInjectable, functionToString],
    [hof_1.val(true), common_1.identity]
]);
function stringify(o) {
    var seen = [];
    function format(val) {
        if (predicates_1.isObject(val)) {
            if (seen.indexOf(val) !== -1)
                return '[circular ref]';
            seen.push(val);
        }
        return stringifyPattern(val);
    }
    return JSON.stringify(o, function (key, val) { return format(val); }).replace(/\\"/g, '"');
}
exports.stringify = stringify;
//# sourceMappingURL=strings.js.map