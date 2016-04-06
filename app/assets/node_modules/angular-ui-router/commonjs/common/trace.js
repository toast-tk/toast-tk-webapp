"use strict";
/**
 * UI-Router Transition Tracing
 *
 * Enable transition tracing to print transition information to the console, in order to help debug your application.
 * Tracing logs detailed information about each Transition to your console.
 *
 * To enable tracing, import the [[trace]] singleton and enable one or more categories.
 *
 * ES6
 * ```
 *
 * import {trace} from "ui-router-ng2"; // or "angular-ui-router"
 * trace.enable(1, 5); // TRANSITION and VIEWCONFIG
 * ```
 *
 * CJS
 * ```
 *
 * let trace = require("angular-ui-router").trace; // or "ui-router-ng2"
 * trace.enable("TRANSITION", "VIEWCONFIG");
 * ```
 *
 * Globals
 * ```
 *
 * let trace = window["angular-ui-router"].trace; // or "ui-router-ng2"
 * trace.enable(); // Trace everything (very verbose)
 * ```
 *
 * @module trace
 */ /** for typedoc */
var hof_1 = require("../common/hof");
var predicates_1 = require("../common/predicates");
var strings_1 = require("./strings");
/** @hidden */
function uiViewString(viewData) {
    if (!viewData)
        return 'ui-view (defunct)';
    return "ui-view id#" + viewData.id + ", contextual name '" + viewData.name + "@" + viewData.creationContext + "', fqn: '" + viewData.fqn + "'";
}
/** @hidden */
var viewConfigString = function (viewConfig) {
    return ("ViewConfig targeting ui-view: '" + viewConfig.viewDecl.$uiViewName + "@" + viewConfig.viewDecl.$uiViewContextAnchor + "', context: '" + viewConfig.viewDecl.$context.name + "'");
};
/** @hidden */
function normalizedCat(input) {
    return predicates_1.isNumber(input) ? Category[input] : Category[Category[input]];
}
/**
 * Trace categories
 *
 * [[Trace.enable]] or [[Trace.disable]] a category
 *
 * `trace.enable(Category.TRANSITION)`
 *
 * These can also be provided using a matching string, or position ordinal
 *
 * `trace.enable("TRANSITION")`
 *
 * `trace.enable(1)`
 */
(function (Category) {
    Category[Category["RESOLVE"] = 0] = "RESOLVE";
    Category[Category["TRANSITION"] = 1] = "TRANSITION";
    Category[Category["HOOK"] = 2] = "HOOK";
    Category[Category["INVOKE"] = 3] = "INVOKE";
    Category[Category["UIVIEW"] = 4] = "UIVIEW";
    Category[Category["VIEWCONFIG"] = 5] = "VIEWCONFIG";
})(exports.Category || (exports.Category = {}));
var Category = exports.Category;
/**
 * Prints UI-Router Transition trace information to the console.
 */
var Trace = (function () {
    function Trace() {
        /** @hidden */
        this._enabled = {};
        this.approximateDigests = 0;
    }
    /** @hidden */
    Trace.prototype._set = function (enabled, categories) {
        var _this = this;
        if (!categories.length) {
            categories = Object.keys(Category)
                .filter(function (k) { return isNaN(parseInt(k, 10)); })
                .map(function (key) { return Category[key]; });
        }
        categories.map(normalizedCat).forEach(function (category) { return _this._enabled[category] = enabled; });
    };
    /**
     * Enables a trace [[Category]]
     *
     * ```
     * trace.enable("TRANSITION");
     * ```
     *
     * @param categories categories to enable. If `categories` is omitted, all categories are enabled.
     *        Also takes strings (category name) or ordinal (category position)
     */
    Trace.prototype.enable = function () {
        var categories = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            categories[_i - 0] = arguments[_i];
        }
        this._set(true, categories);
    };
    /**
     * Disables a trace [[Category]]
     *
     * ```
     * trace.disable("VIEWCONFIG");
     * ```
     *
     * @param categories categories to disable. If `categories` is omitted, all categories are disabled.
     *        Also takes strings (category name) or ordinal (category position)
     */
    Trace.prototype.disable = function () {
        var categories = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            categories[_i - 0] = arguments[_i];
        }
        this._set(false, categories);
    };
    /**
     * Retrieves the enabled stateus of a [[Category]]
     *
     * ```
     * trace.enabled("VIEWCONFIG"); // true or false
     * ```
     *
     * @returns boolean true if the category is enabled
     */
    Trace.prototype.enabled = function (category) {
        return !!this._enabled[normalizedCat(category)];
    };
    /** called by ui-router code */
    Trace.prototype.traceTransitionStart = function (transition) {
        if (!this.enabled(Category.TRANSITION))
            return;
        var tid = transition.$id, digest = this.approximateDigests, transitionStr = strings_1.stringify(transition);
        console.log("Transition #" + tid + " Digest #" + digest + ": Started  -> " + transitionStr);
    };
    /** called by ui-router code */
    Trace.prototype.traceTransitionIgnored = function (transition) {
        if (!this.enabled(Category.TRANSITION))
            return;
        var tid = transition.$id, digest = this.approximateDigests, transitionStr = strings_1.stringify(transition);
        console.log("Transition #" + tid + " Digest #" + digest + ": Ignored  <> " + transitionStr);
    };
    /** called by ui-router code */
    Trace.prototype.traceHookInvocation = function (step, options) {
        if (!this.enabled(Category.HOOK))
            return;
        var tid = hof_1.parse("transition.$id")(options), digest = this.approximateDigests, event = hof_1.parse("traceData.hookType")(options) || "internal", context = hof_1.parse("traceData.context.state.name")(options) || hof_1.parse("traceData.context")(options) || "unknown", name = strings_1.functionToString(step.fn);
        console.log("Transition #" + tid + " Digest #" + digest + ":   Hook -> " + event + " context: " + context + ", " + strings_1.maxLength(200, name));
    };
    /** called by ui-router code */
    Trace.prototype.traceHookResult = function (hookResult, transitionResult, transitionOptions) {
        if (!this.enabled(Category.HOOK))
            return;
        var tid = hof_1.parse("transition.$id")(transitionOptions), digest = this.approximateDigests, hookResultStr = strings_1.stringify(hookResult), transitionResultStr = strings_1.stringify(transitionResult);
        console.log("Transition #" + tid + " Digest #" + digest + ":   <- Hook returned: " + strings_1.maxLength(200, hookResultStr) + ", transition result: " + strings_1.maxLength(200, transitionResultStr));
    };
    /** called by ui-router code */
    Trace.prototype.traceResolvePath = function (path, options) {
        if (!this.enabled(Category.RESOLVE))
            return;
        var tid = hof_1.parse("transition.$id")(options), digest = this.approximateDigests, pathStr = path && path.toString(), policyStr = options && options.resolvePolicy;
        console.log("Transition #" + tid + " Digest #" + digest + ":         Resolving " + pathStr + " (" + policyStr + ")");
    };
    /** called by ui-router code */
    Trace.prototype.traceResolvePathElement = function (pathElement, resolvablePromises, options) {
        if (!this.enabled(Category.RESOLVE))
            return;
        if (!resolvablePromises.length)
            return;
        var tid = hof_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvablePromisesStr = Object.keys(resolvablePromises).join(", "), pathElementStr = pathElement && pathElement.toString(), policyStr = options && options.resolvePolicy;
        console.log("Transition #" + tid + " Digest #" + digest + ":         Resolve " + pathElementStr + " resolvables: [" + resolvablePromisesStr + "] (" + policyStr + ")");
    };
    /** called by ui-router code */
    Trace.prototype.traceResolveResolvable = function (resolvable, options) {
        if (!this.enabled(Category.RESOLVE))
            return;
        var tid = hof_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvableStr = resolvable && resolvable.toString();
        console.log("Transition #" + tid + " Digest #" + digest + ":               Resolving -> " + resolvableStr);
    };
    /** called by ui-router code */
    Trace.prototype.traceResolvableResolved = function (resolvable, options) {
        if (!this.enabled(Category.RESOLVE))
            return;
        var tid = hof_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvableStr = resolvable && resolvable.toString(), result = strings_1.stringify(resolvable.data);
        console.log("Transition #" + tid + " Digest #" + digest + ":               <- Resolved  " + resolvableStr + " to: " + strings_1.maxLength(200, result));
    };
    /** called by ui-router code */
    Trace.prototype.tracePathElementInvoke = function (node, fn, deps, options) {
        if (!this.enabled(Category.INVOKE))
            return;
        var tid = hof_1.parse("transition.$id")(options), digest = this.approximateDigests, stateName = node && node.state && node.state.toString(), fnName = strings_1.functionToString(fn);
        console.log("Transition #" + tid + " Digest #" + digest + ":         Invoke " + options.when + ": context: " + stateName + " " + strings_1.maxLength(200, fnName));
    };
    /** called by ui-router code */
    Trace.prototype.traceError = function (error, transition) {
        if (!this.enabled(Category.TRANSITION))
            return;
        var tid = transition.$id, digest = this.approximateDigests, transitionStr = strings_1.stringify(transition);
        console.log("Transition #" + tid + " Digest #" + digest + ": <- Rejected " + transitionStr + ", reason: " + error);
    };
    /** called by ui-router code */
    Trace.prototype.traceSuccess = function (finalState, transition) {
        if (!this.enabled(Category.TRANSITION))
            return;
        var tid = transition.$id, digest = this.approximateDigests, state = finalState.name, transitionStr = strings_1.stringify(transition);
        console.log("Transition #" + tid + " Digest #" + digest + ": <- Success  " + transitionStr + ", final state: " + state);
    };
    /** called by ui-router code */
    Trace.prototype.traceUiViewEvent = function (event, viewData, extra) {
        if (extra === void 0) { extra = ""; }
        if (!this.enabled(Category.UIVIEW))
            return;
        console.log("ui-view: " + strings_1.padString(30, event) + " " + uiViewString(viewData) + extra);
    };
    /** called by ui-router code */
    Trace.prototype.traceUiViewConfigUpdated = function (viewData, context) {
        if (!this.enabled(Category.UIVIEW))
            return;
        this.traceUiViewEvent("Updating", viewData, " with ViewConfig from context='" + context + "'");
    };
    /** called by ui-router code */
    Trace.prototype.traceUiViewScopeCreated = function (viewData, newScope) {
        if (!this.enabled(Category.UIVIEW))
            return;
        this.traceUiViewEvent("Created scope for", viewData, ", scope #" + newScope.$id);
    };
    /** called by ui-router code */
    Trace.prototype.traceUiViewFill = function (viewData, html) {
        if (!this.enabled(Category.UIVIEW))
            return;
        this.traceUiViewEvent("Fill", viewData, " with: " + strings_1.maxLength(200, html));
    };
    /** called by ui-router code */
    Trace.prototype.traceViewServiceEvent = function (event, viewConfig) {
        if (!this.enabled(Category.VIEWCONFIG))
            return;
        console.log("$view.ViewConfig: " + event + " " + viewConfigString(viewConfig));
    };
    /** called by ui-router code */
    Trace.prototype.traceViewServiceUiViewEvent = function (event, viewData) {
        if (!this.enabled(Category.VIEWCONFIG))
            return;
        console.log("$view.ViewConfig: " + event + " " + uiViewString(viewData));
    };
    return Trace;
}());
exports.Trace = Trace;
/**
 * The [[Trace]] singleton
 *
 * @example
 * ```js
 *
 * import {trace} from "angular-ui-router";
 * trace.enable(1, 5);
 * ```
 */
var trace = new Trace();
exports.trace = trace;
//# sourceMappingURL=trace.js.map