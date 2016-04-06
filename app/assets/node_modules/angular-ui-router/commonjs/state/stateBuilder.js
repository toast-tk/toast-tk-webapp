"use strict";
/** @module state */ /** for typedoc */
var common_1 = require("../common/common");
var predicates_1 = require("../common/predicates");
var hof_1 = require("../common/hof");
var module_1 = require("../params/module");
var parseUrl = function (url) {
    if (!predicates_1.isString(url))
        return false;
    var root = url.charAt(0) === '^';
    return { val: root ? url.substring(1) : url, root: root };
};
/**
 * @internalapi A internal global service
 *
 * StateBuilder is a factory for the internal [[State]] objects.
 *
 * When you register a state with the [[StateRegistry]], you register a plain old javascript object which
 * conforms to the [[StateDeclaration]] interface.  This factory takes that object and builds the corresponding
 * [[State]] object, which has an API and is used internally.
 *
 * Custom properties or API may be added to the internal [[State]] object by registering a decorator function
 * using the [[builder]] method.
 */
var StateBuilder = (function () {
    function StateBuilder(matcher, $urlMatcherFactoryProvider) {
        this.matcher = matcher;
        var self = this;
        var isRoot = function (state) { return state.name === ""; };
        var root = function () { return matcher.find(""); };
        this.builders = {
            self: [function (state) {
                    state.self.$$state = function () { return state; };
                    return state.self;
                }],
            parent: [function (state) {
                    if (isRoot(state))
                        return null;
                    return matcher.find(self.parentName(state)) || root();
                }],
            data: [function (state) {
                    if (state.parent && state.parent.data) {
                        state.data = state.self.data = common_1.inherit(state.parent.data, state.data);
                    }
                    return state.data;
                }],
            // Build a URLMatcher if necessary, either via a relative or absolute URL
            url: [function (state) {
                    var stateDec = state;
                    var parsed = parseUrl(stateDec.url), parent = state.parent;
                    var url = !parsed ? stateDec.url : $urlMatcherFactoryProvider.compile(parsed.val, {
                        params: state.params || {},
                        paramMap: function (paramConfig, isSearch) {
                            if (stateDec.reloadOnSearch === false && isSearch)
                                paramConfig = common_1.extend(paramConfig || {}, { dynamic: true });
                            return paramConfig;
                        }
                    });
                    if (!url)
                        return null;
                    if (!$urlMatcherFactoryProvider.isMatcher(url))
                        throw new Error("Invalid url '" + url + "' in state '" + state + "'");
                    return (parsed && parsed.root) ? url : ((parent && parent.navigable) || root()).url.append(url);
                }],
            // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
            navigable: [function (state) {
                    return !isRoot(state) && state.url ? state : (state.parent ? state.parent.navigable : null);
                }],
            params: [function (state) {
                    var makeConfigParam = function (config, id) { return module_1.Param.fromConfig(id, null, config); };
                    var urlParams = (state.url && state.url.parameters({ inherit: false })) || [];
                    var nonUrlParams = common_1.values(common_1.map(common_1.omit(state.params || {}, urlParams.map(hof_1.prop('id'))), makeConfigParam));
                    return urlParams.concat(nonUrlParams).map(function (p) { return [p.id, p]; }).reduce(common_1.applyPairs, {});
                }],
            // Each framework-specific ui-router implementation should define its own `views` builder
            // e.g., src/ng1/viewsBuilder.ts
            views: [],
            // Keep a full path from the root down to this state as this is needed for state activation.
            path: [function (state) {
                    return state.parent ? state.parent.path.concat(state) : [state];
                }],
            // Speed up $state.includes() as it's used a lot
            includes: [function (state) {
                    var includes = state.parent ? common_1.extend({}, state.parent.includes) : {};
                    includes[state.name] = true;
                    return includes;
                }]
        };
    }
    /**
     * Registers a [[BuilderFunction]] for a specific [[State]] property (e.g., `parent`, `url`, or `path`).
     * More than one BuilderFunction can be registered for a given property.
     *
     * The BuilderFunction(s) will be used to define the property on any subsequently built [[State]] objects.
     *
     * @param name The name of the State property being registered for.
     * @param fn The BuilderFunction which will be used to build the State property
     * @returns a function which deregisters the BuilderFunction
     */
    StateBuilder.prototype.builder = function (name, fn) {
        var builders = this.builders;
        var array = builders[name] || [];
        // Backwards compat: if only one builder exists, return it, else return whole arary.
        if (predicates_1.isString(name) && !predicates_1.isDefined(fn))
            return array.length > 1 ? array : array[0];
        if (!predicates_1.isString(name) || !predicates_1.isFunction(fn))
            return;
        builders[name] = array;
        builders[name].push(fn);
        return function () { return builders[name].splice(builders[name].indexOf(fn, 1)) && null; };
    };
    /**
     * Builds all of the properties on an essentially blank State object, returning a State object which has all its
     * properties and API built.
     *
     * @param state an uninitialized State object
     * @returns the built State object
     */
    StateBuilder.prototype.build = function (state) {
        var _a = this, matcher = _a.matcher, builders = _a.builders;
        var parent = this.parentName(state);
        if (parent && !matcher.find(parent))
            return null;
        for (var key in builders) {
            if (!builders.hasOwnProperty(key))
                continue;
            var chain = builders[key].reduce(function (parentFn, step) { return function (_state) { return step(_state, parentFn); }; }, common_1.noop);
            state[key] = chain(state);
        }
        return state;
    };
    StateBuilder.prototype.parentName = function (state) {
        var name = state.name || "";
        if (name.indexOf('.') !== -1)
            return name.substring(0, name.lastIndexOf('.'));
        if (!state.parent)
            return "";
        return predicates_1.isString(state.parent) ? state.parent : state.parent.name;
    };
    StateBuilder.prototype.name = function (state) {
        var name = state.name;
        if (name.indexOf('.') !== -1 || !state.parent)
            return name;
        var parentName = predicates_1.isString(state.parent) ? state.parent : state.parent.name;
        return parentName ? parentName + "." + name : name;
    };
    return StateBuilder;
}());
exports.StateBuilder = StateBuilder;
//# sourceMappingURL=stateBuilder.js.map