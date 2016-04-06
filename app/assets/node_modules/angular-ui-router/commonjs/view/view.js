"use strict";
/** @module view */ /** for typedoc */
var common_1 = require("../common/common");
var hof_1 = require("../common/hof");
var predicates_1 = require("../common/predicates");
var module_1 = require("../common/module");
var match = function (obj1) {
    var keys = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        keys[_i - 1] = arguments[_i];
    }
    return function (obj2) { return keys.reduce(function (memo, key) { return memo && obj1[key] === obj2[key]; }, true); };
};
/**
 * The View service
 */
var ViewService = (function () {
    function ViewService() {
        var _this = this;
        this.uiViews = [];
        this.viewConfigs = [];
        this._viewConfigFactories = {};
        this.sync = function () {
            var uiViewsByFqn = _this.uiViews.map(function (uiv) { return [uiv.fqn, uiv]; }).reduce(common_1.applyPairs, {});
            /**
             * Given a ui-view and a ViewConfig, determines if they "match".
             *
             * A ui-view has a fully qualified name (fqn) and a context object.  The fqn is built from its overall location in
             * the DOM, describing its nesting relationship to any parent ui-view tags it is nested inside of.
             *
             * A ViewConfig has a target ui-view name and a context anchor.  The ui-view name can be a simple name, or
             * can be a segmented ui-view path, describing a portion of a ui-view fqn.
             *
             * If the ViewConfig's target ui-view name is a simple name (no dots), then a ui-view matches if:
             * - the ui-view's name matches the ViewConfig's target name
             * - the ui-view's context matches the ViewConfig's anchor
             *
             * If the ViewConfig's target ui-view name is a segmented name (with dots), then a ui-view matches if:
             * - There exists a parent ui-view where:
             *    - the parent ui-view's name matches the first segment (index 0) of the ViewConfig's target name
             *    - the parent ui-view's context matches the ViewConfig's anchor
             * - And the remaining segments (index 1..n) of the ViewConfig's target name match the tail of the ui-view's fqn
             *
             * Example:
             *
             * DOM:
             * <div ui-view>                        <!-- created in the root context (name: "") -->
             *   <div ui-view="foo">                <!-- created in the context named: "A"      -->
             *     <div ui-view>                    <!-- created in the context named: "A.B"    -->
             *       <div ui-view="bar">            <!-- created in the context named: "A.B.C"  -->
             *       </div>
             *     </div>
             *   </div>
             * </div>
             *
             * uiViews: [
             *  { fqn: "$default",                  creationContext: { name: "" } },
             *  { fqn: "$default.foo",              creationContext: { name: "A" } },
             *  { fqn: "$default.foo.$default",     creationContext: { name: "A.B" } }
             *  { fqn: "$default.foo.$default.bar", creationContext: { name: "A.B.C" } }
             * ]
             *
             * These four view configs all match the ui-view with the fqn: "$default.foo.$default.bar":
             *
             * - ViewConfig1: { uiViewName: "bar",                       uiViewContextAnchor: "A.B.C" }
             * - ViewConfig2: { uiViewName: "$default.bar",              uiViewContextAnchor: "A.B" }
             * - ViewConfig3: { uiViewName: "foo.$default.bar",          uiViewContextAnchor: "A" }
             * - ViewConfig4: { uiViewName: "$default.foo.$default.bar", uiViewContextAnchor: "" }
             *
             * Using ViewConfig3 as an example, it matches the ui-view with fqn "$default.foo.$default.bar" because:
             * - The ViewConfig's segmented target name is: [ "foo", "$default", "bar" ]
             * - There exists a parent ui-view (which has fqn: "$default.foo") where:
             *    - the parent ui-view's name "foo" matches the first segment "foo" of the ViewConfig's target name
             *    - the parent ui-view's context "A" matches the ViewConfig's anchor context "A"
             * - And the remaining segments [ "$default", "bar" ].join("."_ of the ViewConfig's target name match
             *   the tail of the ui-view's fqn "default.bar"
             */
            var matches = function (uiView) { return function (viewConfig) {
                // Split names apart from both viewConfig and uiView into segments
                var vc = viewConfig.viewDecl;
                var vcSegments = vc.$uiViewName.split(".");
                var uivSegments = uiView.fqn.split(".");
                // Check if the tails of the segment arrays match. ex, these arrays' tails match:
                // vc: ["foo", "bar"], uiv fqn: ["$default", "foo", "bar"]
                if (!common_1.equals(vcSegments, uivSegments.slice(0 - vcSegments.length)))
                    return false;
                // Now check if the fqn ending at the first segment of the viewConfig matches the context:
                // ["$default", "foo"].join(".") == "$default.foo", does the ui-view $default.foo context match?
                var negOffset = (1 - vcSegments.length) || undefined;
                var fqnToFirstSegment = uivSegments.slice(0, negOffset).join(".");
                var uiViewContext = uiViewsByFqn[fqnToFirstSegment].creationContext;
                return vc.$uiViewContextAnchor === (uiViewContext && uiViewContext.name);
            }; };
            // Return the number of dots in the fully qualified name
            function uiViewDepth(uiView) {
                return uiView.fqn.split(".").length;
            }
            // Return the ViewConfig's context's depth in the context tree.
            function viewConfigDepth(config) {
                var context = config.viewDecl.$context, count = 0;
                while (++count && context.parent)
                    context = context.parent;
                return count;
            }
            // Given a depth function, returns a compare function which can return either ascending or descending order
            var depthCompare = hof_1.curry(function (depthFn, posNeg, left, right) { return posNeg * (depthFn(left) - depthFn(right)); });
            var matchingConfigPair = function (uiView) {
                var matchingConfigs = _this.viewConfigs.filter(matches(uiView));
                if (matchingConfigs.length > 1)
                    matchingConfigs.sort(depthCompare(viewConfigDepth, -1)); // descending
                return [uiView, matchingConfigs[0]];
            };
            var configureUiView = function (_a) {
                var uiView = _a[0], viewConfig = _a[1];
                // If a parent ui-view is reconfigured, it could destroy child ui-views.
                // Before configuring a child ui-view, make sure it's still in the active uiViews array.
                if (_this.uiViews.indexOf(uiView) !== -1)
                    uiView.configUpdated(viewConfig);
            };
            _this.uiViews.sort(depthCompare(uiViewDepth, 1)).map(matchingConfigPair).forEach(configureUiView);
        };
    }
    ViewService.prototype.rootContext = function (context) {
        return this._rootContext = context || this._rootContext;
    };
    ;
    ViewService.prototype.viewConfigFactory = function (viewType, factory) {
        this._viewConfigFactories[viewType] = factory;
    };
    ViewService.prototype.createViewConfig = function (node, decl) {
        var cfgFactory = this._viewConfigFactories[decl.$type];
        if (!cfgFactory)
            throw new Error("ViewService: No view config factory registered for type " + decl.$type);
        return cfgFactory(node, decl);
    };
    /**
     * De-registers a ViewConfig.
     *
     * @param viewConfig The ViewConfig view to deregister.
     */
    ViewService.prototype.deactivateViewConfig = function (viewConfig) {
        module_1.trace.traceViewServiceEvent("<- Removing", viewConfig);
        common_1.removeFrom(this.viewConfigs, viewConfig);
    };
    ;
    ViewService.prototype.activateViewConfig = function (viewConfig) {
        module_1.trace.traceViewServiceEvent("-> Registering", viewConfig);
        this.viewConfigs.push(viewConfig);
    };
    ;
    /**
     * Allows a `ui-view` element to register its canonical name with a callback that allows it to
     * be updated with a template, controller, and local variables.
     *
     * @param {String} name The fully-qualified name of the `ui-view` object being registered.
     * @param {Function} configUpdatedCallback A callback that receives updates to the content & configuration
     *                   of the view.
     * @return {Function} Returns a de-registration function used when the view is destroyed.
     */
    ViewService.prototype.registerUiView = function (uiView) {
        module_1.trace.traceViewServiceUiViewEvent("-> Registering", uiView);
        var uiViews = this.uiViews;
        var fqnMatches = function (uiv) { return uiv.fqn === uiView.fqn; };
        if (uiViews.filter(fqnMatches).length)
            module_1.trace.traceViewServiceUiViewEvent("!!!! duplicate uiView named:", uiView);
        uiViews.push(uiView);
        this.sync();
        return function () {
            var idx = uiViews.indexOf(uiView);
            if (idx <= 0) {
                module_1.trace.traceViewServiceUiViewEvent("Tried removing non-registered uiView", uiView);
                return;
            }
            module_1.trace.traceViewServiceUiViewEvent("<- Deregistering", uiView);
            common_1.removeFrom(uiViews)(uiView);
        };
    };
    ;
    /**
     * Returns the list of views currently available on the page, by fully-qualified name.
     *
     * @return {Array} Returns an array of fully-qualified view names.
     */
    ViewService.prototype.available = function () {
        return this.uiViews.map(hof_1.prop("fqn"));
    };
    /**
     * Returns the list of views on the page containing loaded content.
     *
     * @return {Array} Returns an array of fully-qualified view names.
     */
    ViewService.prototype.active = function () {
        return this.uiViews.filter(hof_1.prop("$config")).map(hof_1.prop("name"));
    };
    /**
     * Normalizes a view's name from a state.views configuration block.
     *
     * @param context the context object (state declaration) that the view belongs to
     * @param rawViewName the name of the view, as declared in the [[StateDeclaration.views]]
     *
     * @returns the normalized uiViewName and uiViewContextAnchor that the view targets
     */
    ViewService.normalizeUiViewTarget = function (context, rawViewName) {
        if (rawViewName === void 0) { rawViewName = ""; }
        // TODO: Validate incoming view name with a regexp to allow:
        // ex: "view.name@foo.bar" , "^.^.view.name" , "view.name@^.^" , "" ,
        // "@" , "$default@^" , "!$default.$default" , "!foo.bar"
        var viewAtContext = rawViewName.split("@");
        var uiViewName = viewAtContext[0] || "$default"; // default to unnamed view
        var uiViewContextAnchor = predicates_1.isString(viewAtContext[1]) ? viewAtContext[1] : "^"; // default to parent context
        // Handle relative view-name sugar syntax.
        // Matches rawViewName "^.^.^.foo.bar" into array: ["^.^.^.foo.bar", "^.^.^", "foo.bar"],
        var relativeViewNameSugar = /^(\^(?:\.\^)*)\.(.*$)/.exec(uiViewName);
        if (relativeViewNameSugar) {
            // Clobbers existing contextAnchor (rawViewName validation will fix this)
            uiViewContextAnchor = relativeViewNameSugar[1]; // set anchor to "^.^.^"
            uiViewName = relativeViewNameSugar[2]; // set view-name to "foo.bar"
        }
        if (uiViewName.charAt(0) === '!') {
            uiViewName = uiViewName.substr(1);
            uiViewContextAnchor = ""; // target absolutely from root
        }
        // handle parent relative targeting "^.^.^"
        var relativeMatch = /^(\^(?:\.\^)*)$/;
        if (relativeMatch.exec(uiViewContextAnchor)) {
            var anchor = uiViewContextAnchor.split(".").reduce((function (anchor, x) { return anchor.parent; }), context);
            uiViewContextAnchor = anchor.name;
        }
        return { uiViewName: uiViewName, uiViewContextAnchor: uiViewContextAnchor };
    };
    return ViewService;
}());
exports.ViewService = ViewService;
//# sourceMappingURL=view.js.map