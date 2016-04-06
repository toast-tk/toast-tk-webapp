"use strict";
var common_1 = require("../common/common");
var strings_1 = require("../common/strings");
var view_1 = require("../view/view");
var predicates_1 = require("../common/predicates");
var coreservices_1 = require("../common/coreservices");
var trace_1 = require("../common/trace");
var templateFactory_1 = require("./templateFactory");
exports.ng1ViewConfigFactory = function (node, view) { return new Ng1ViewConfig(node, view); };
/**
 * This is a [[StateBuilder.builder]] function for angular1 `views`.
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to angular-ui-router (ng1).
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object
 * and applies the state-level configuration to a view named `$default`.
 */
function ng1ViewsBuilder(state) {
    var tplKeys = ['templateProvider', 'templateUrl', 'template', 'notify', 'async'], ctrlKeys = ['controller', 'controllerProvider', 'controllerAs', 'resolveAs'], compKeys = ['component', 'bindings'], nonCompKeys = tplKeys.concat(ctrlKeys), allKeys = compKeys.concat(nonCompKeys);
    var views = {}, viewsObject = state.views || { "$default": common_1.pick(state, allKeys) };
    common_1.forEach(viewsObject, function (config, name) {
        // Account for views: { "": { template... } }
        name = name || "$default";
        // Account for views: { header: "headerComponent" }
        if (predicates_1.isString(config))
            config = { component: config };
        if (!Object.keys(config).length)
            return;
        // Configure this view for routing to an angular 1.5+ style .component (or any directive, really)
        if (config.component) {
            if (nonCompKeys.map(function (key) { return predicates_1.isDefined(config[key]); }).reduce(common_1.anyTrueR, false)) {
                throw new Error("Cannot combine: " + compKeys.join("|") + " with: " + nonCompKeys.join("|") + " in stateview: 'name@" + state.name + "'");
            }
            // Dynamically build a template like "<component-name input1='$resolve.foo'></component-name>"
            config.templateProvider = ['$injector', function ($injector) {
                    var resolveFor = function (key) { return config.bindings && config.bindings[key] || key; };
                    var prefix = angular.version.minor >= 3 ? "::" : "";
                    var attrs = getComponentInputs($injector, config.component)
                        .map(function (key) { return (strings_1.kebobString(key) + "='" + prefix + "$resolve." + resolveFor(key) + "'"); }).join(" ");
                    var kebobName = strings_1.kebobString(config.component);
                    return "<" + kebobName + " " + attrs + "></" + kebobName + ">";
                }];
        }
        config.resolveAs = config.resolveAs || '$resolve';
        config.$type = "ng1";
        config.$context = state;
        config.$name = name;
        var normalized = view_1.ViewService.normalizeUiViewTarget(config.$context, config.$name);
        config.$uiViewName = normalized.uiViewName;
        config.$uiViewContextAnchor = normalized.uiViewContextAnchor;
        views[name] = config;
    });
    return views;
}
exports.ng1ViewsBuilder = ng1ViewsBuilder;
// for ng 1.2 style, process the scope: { input: "=foo" } object
var scopeBindings = function (bindingsObj) { return Object.keys(bindingsObj || {})
    .map(function (key) { return [key, /^[=<](.*)/.exec(bindingsObj[key])]; })
    .filter(function (tuple) { return predicates_1.isDefined(tuple[1]); })
    .map(function (tuple) { return tuple[1][1] || tuple[0]; }); };
// for ng 1.3+ bindToController or 1.5 component style, process a $$bindings object
var bindToCtrlBindings = function (bindingsObj) { return Object.keys(bindingsObj || {})
    .filter(function (key) { return !!/[=<]/.exec(bindingsObj[key].mode); })
    .map(function (key) { return bindingsObj[key].attrName; }); };
// Given a directive definition, find its object input attributes
// Use different properties, depending on the type of directive (component, bindToController, normal)
var getBindings = function (def) {
    if (predicates_1.isObject(def.bindToController))
        return scopeBindings(def.bindToController);
    if (def.$$bindings && def.$$bindings.bindToController)
        return bindToCtrlBindings(def.$$bindings.bindToController);
    if (def.$$isolateBindings)
        return bindToCtrlBindings(def.$$isolateBindings);
    return scopeBindings(def.scope);
};
// Gets all the directive(s)' inputs ('=' and '<')
function getComponentInputs($injector, name) {
    var cmpDefs = $injector.get(name + "Directive"); // could be multiple
    if (!cmpDefs || !cmpDefs.length)
        throw new Error("Unable to find component named '" + name + "'");
    return cmpDefs.map(getBindings).reduce(common_1.unnestR, []);
}
var Ng1ViewConfig = (function () {
    function Ng1ViewConfig(node, viewDecl) {
        this.node = node;
        this.viewDecl = viewDecl;
        this.loaded = false;
    }
    Ng1ViewConfig.prototype.load = function () {
        var _this = this;
        var $q = coreservices_1.services.$q;
        if (!this.hasTemplate())
            throw new Error("No template configuration specified for '" + this.viewDecl.$uiViewName + "@" + this.viewDecl.$uiViewContextAnchor + "'");
        var injector = this.node.resolveContext;
        var params = this.node.paramValues;
        var promises = {
            template: $q.when(this.getTemplate(params, new templateFactory_1.TemplateFactory(), injector)),
            controller: $q.when(this.getController(injector))
        };
        return $q.all(promises).then(function (results) {
            trace_1.trace.traceViewServiceEvent("Loaded", _this);
            _this.controller = results.controller;
            _this.template = results.template;
        });
    };
    /**
     * Checks a view configuration to ensure that it specifies a template.
     *
     * @return {boolean} Returns `true` if the configuration contains a valid template, otherwise `false`.
     */
    Ng1ViewConfig.prototype.hasTemplate = function () {
        return !!(this.viewDecl.template || this.viewDecl.templateUrl || this.viewDecl.templateProvider);
    };
    Ng1ViewConfig.prototype.getTemplate = function (params, $factory, injector) {
        return $factory.fromConfig(this.viewDecl, params, injector.invokeLater.bind(injector));
    };
    /**
     * Gets the controller for a view configuration.
     *
     * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
     */
    Ng1ViewConfig.prototype.getController = function (injector) {
        //* @param {Object} locals A context object from transition.context() to invoke a function in the correct context
        var provider = this.viewDecl.controllerProvider;
        return predicates_1.isInjectable(provider) ? injector.invokeLater(provider, {}) : this.viewDecl.controller;
    };
    return Ng1ViewConfig;
}());
exports.Ng1ViewConfig = Ng1ViewConfig;
//# sourceMappingURL=viewsBuilder.js.map