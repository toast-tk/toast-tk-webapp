/**
 * # UI-Router for Angular 1
 *
 * - Provides an implementation for the [[CoreServices]] API, based on angular 1 services.
 * - Also registers some services with the angular 1 injector.
 * - Creates and bootstraps a new [[UIRouter]] object.  Ties it to the the angular 1 lifecycle.
 *
 * @module ng1
 * @preferred
 */
"use strict";
/** for typedoc */
var router_1 = require("../router");
var coreservices_1 = require("../common/coreservices");
var common_1 = require("../common/common");
var hof_1 = require("../common/hof");
var predicates_1 = require("../common/predicates");
var module_1 = require("../path/module");
var module_2 = require("../resolve/module");
var module_3 = require("../state/module");
var trace_1 = require("../common/trace");
var viewsBuilder_1 = require("./viewsBuilder");
var templateFactory_1 = require("./templateFactory");
/** @hidden */
var app = angular.module("ui.router.angular1", []);
/**
 * @ngdoc overview
 * @name ui.router.util
 *
 * @description
 * # ui.router.util sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.util', ['ng', 'ui.router.init']);
/**
 * @ngdoc overview
 * @name ui.router.router
 *
 * @requires ui.router.util
 *
 * @description
 * # ui.router.router sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 */
angular.module('ui.router.router', ['ui.router.util']);
/**
 * @ngdoc overview
 * @name ui.router.state
 *
 * @requires ui.router.router
 * @requires ui.router.util
 *
 * @description
 * # ui.router.state sub-module
 *
 * This module is a dependency of the main ui.router module. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.state', ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);
/**
 * @ngdoc overview
 * @name ui.router
 *
 * @requires ui.router.state
 *
 * @description
 * # ui.router
 *
 * ## The main module for ui.router
 * There are several sub-modules included with the ui.router module, however only this module is needed
 * as a dependency within your angular app. The other modules are for organization purposes.
 *
 * The modules are:
 * * ui.router - the main "umbrella" module
 * * ui.router.router -
 *
 * *You'll need to include **only** this module as the dependency within your angular app.*
 *
 * <pre>
 * <!doctype html>
 * <html ng-app="myApp">
 * <head>
 *   <script src="js/angular.js"></script>
 *   <!-- Include the ui-router script -->
 *   <script src="js/angular-ui-router.min.js"></script>
 *   <script>
 *     // ...and add 'ui.router' as a dependency
 *     var myApp = angular.module('myApp', ['ui.router']);
 *   </script>
 * </head>
 * <body>
 * </body>
 * </html>
 * </pre>
 */
angular.module('ui.router', ['ui.router.init', 'ui.router.state', 'ui.router.angular1']);
angular.module('ui.router.compat', ['ui.router']);
/**
 * Annotates a controller expression (may be a controller function(), a "controllername",
 * or "controllername as name")
 *
 * - Temporarily decorates $injector.instantiate.
 * - Invokes $controller() service
 *   - Calls $injector.instantiate with controller constructor
 * - Annotate constructor
 * - Undecorate $injector
 *
 * returns an array of strings, which are the arguments of the controller expression
 */
function annotateController(controllerExpression) {
    var $injector = coreservices_1.services.$injector;
    var $controller = $injector.get("$controller");
    var oldInstantiate = $injector.instantiate;
    try {
        var deps_1;
        $injector.instantiate = function fakeInstantiate(constructorFunction) {
            $injector.instantiate = oldInstantiate; // Un-decorate ASAP
            deps_1 = $injector.annotate(constructorFunction);
        };
        $controller(controllerExpression, { $scope: {} });
        return deps_1;
    }
    finally {
        $injector.instantiate = oldInstantiate;
    }
}
exports.annotateController = annotateController;
runBlock.$inject = ['$injector', '$q'];
function runBlock($injector, $q) {
    coreservices_1.services.$injector = $injector;
    coreservices_1.services.$q = $q;
}
app.run(runBlock);
var router = null;
ng1UIRouter.$inject = ['$locationProvider'];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
function ng1UIRouter($locationProvider) {
    // Create a new instance of the Router when the ng1UIRouterProvider is initialized
    router = new router_1.UIRouter();
    // Apply ng1 `views` builder to the StateBuilder
    router.stateRegistry.decorator("views", viewsBuilder_1.ng1ViewsBuilder);
    router.viewService.viewConfigFactory('ng1', viewsBuilder_1.ng1ViewConfigFactory);
    // Bind LocationConfig.hashPrefix to $locationProvider.hashPrefix
    common_1.bindFunctions($locationProvider, coreservices_1.services.locationConfig, $locationProvider, ['hashPrefix']);
    // Create a LocationService.onChange registry
    var urlListeners = [];
    coreservices_1.services.location.onChange = function (callback) {
        urlListeners.push(callback);
        return function () { return common_1.removeFrom(urlListeners)(callback); };
    };
    this.$get = $get;
    $get.$inject = ['$location', '$browser', '$sniffer', '$rootScope', '$http', '$templateCache'];
    function $get($location, $browser, $sniffer, $rootScope, $http, $templateCache) {
        // Bind $locationChangeSuccess to the listeners registered in LocationService.onChange
        $rootScope.$on("$locationChangeSuccess", function (evt) { return urlListeners.forEach(function (fn) { return fn(evt); }); });
        // Bind LocationConfig.html5Mode to $locationProvider.html5Mode and $sniffer.history
        coreservices_1.services.locationConfig.html5Mode = function () {
            var html5Mode = $locationProvider.html5Mode();
            html5Mode = predicates_1.isObject(html5Mode) ? html5Mode.enabled : html5Mode;
            return html5Mode && $sniffer.history;
        };
        coreservices_1.services.template.get = function (url) {
            return $http.get(url, { cache: $templateCache, headers: { Accept: 'text/html' } }).then(hof_1.prop("data"));
        };
        // Bind these LocationService functions to $location
        common_1.bindFunctions($location, coreservices_1.services.location, $location, ["replace", "url", "path", "search", "hash"]);
        // Bind these LocationConfig functions to $location
        common_1.bindFunctions($location, coreservices_1.services.locationConfig, $location, ['port', 'protocol', 'host']);
        // Bind these LocationConfig functions to $browser
        common_1.bindFunctions($browser, coreservices_1.services.locationConfig, $browser, ['baseHref']);
        return router;
    }
}
var resolveFactory = function () { return ({
    /**
     * This emulates most of the behavior of the ui-router 0.2.x $resolve.resolve() service API.
     * @param invocables an object, with keys as resolve names and values as injectable functions
     * @param locals key/value pre-resolved data (locals)
     * @param parent a promise for a "parent resolve"
     */
    resolve: function (invocables, locals, parent) {
        if (locals === void 0) { locals = {}; }
        var parentNode = new module_1.Node(new module_3.State({ params: {} }));
        var node = new module_1.Node(new module_3.State({ params: {} }));
        var context = new module_2.ResolveContext([parentNode, node]);
        context.addResolvables(module_2.Resolvable.makeResolvables(invocables), node.state);
        var resolveData = function (parentLocals) {
            var rewrap = function (_locals) { return module_2.Resolvable.makeResolvables(common_1.map(_locals, function (local) { return function () { return local; }; })); };
            context.addResolvables(rewrap(parentLocals), parentNode.state);
            context.addResolvables(rewrap(locals), node.state);
            return context.resolvePath();
        };
        return parent ? parent.then(resolveData) : resolveData({});
    }
}); };
function $stateParamsFactory(ng1UIRouter) {
    return ng1UIRouter.globals.params;
}
// The 'ui.router' ng1 module depends on 'ui.router.init' module.
angular.module('ui.router.init', []).provider("ng1UIRouter", ng1UIRouter);
// This effectively calls $get() to init when we enter runtime
angular.module('ui.router.init').run(['ng1UIRouter', function (ng1UIRouter) { }]);
// $urlMatcherFactory service and $urlMatcherFactoryProvider
angular.module('ui.router.util').provider('$urlMatcherFactory', ['ng1UIRouterProvider', function () { return router.urlMatcherFactory; }]);
angular.module('ui.router.util').run(['$urlMatcherFactory', function ($urlMatcherFactory) { }]);
// $urlRouter service and $urlRouterProvider
function getUrlRouterProvider() {
    router.urlRouterProvider["$get"] = function () {
        router.urlRouter.update(true);
        if (!this.interceptDeferred)
            router.urlRouter.listen();
        return router.urlRouter;
    };
    return router.urlRouterProvider;
}
angular.module('ui.router.router').provider('$urlRouter', ['ng1UIRouterProvider', getUrlRouterProvider]);
angular.module('ui.router.router').run(['$urlRouter', function ($urlRouter) { }]);
// $state service and $stateProvider
// $urlRouter service and $urlRouterProvider
function getStateProvider() {
    router.stateProvider["$get"] = function () {
        // Autoflush once we are in runtime
        router.stateRegistry.stateQueue.autoFlush(router.stateService);
        return router.stateService;
    };
    return router.stateProvider;
}
angular.module('ui.router.state').provider('$state', ['ng1UIRouterProvider', getStateProvider]);
angular.module('ui.router.state').run(['$state', function ($state) { }]);
// $stateParams service
angular.module('ui.router.state').factory('$stateParams', ['ng1UIRouter', function (ng1UIRouter) {
        return ng1UIRouter.globals.params;
    }]);
// $transitions service and $transitionsProvider
function getTransitionsProvider() {
    loadAllControllerLocals.$inject = ['$transition$'];
    function loadAllControllerLocals($transition$) {
        var loadLocals = function (vc) {
            var node = common_1.find($transition$.treeChanges().to, hof_1.propEq('state', vc.viewDecl.$context));
            // Temporary fix; This whole callback should be nuked when fixing #2662
            if (!node)
                return coreservices_1.services.$q.when();
            var resolveCtx = node.resolveContext;
            var controllerDeps = annotateController(vc.controller);
            var resolvables = resolveCtx.getResolvables();
            function $loadControllerLocals() { }
            $loadControllerLocals.$inject = controllerDeps.filter(function (dep) { return resolvables.hasOwnProperty(dep); });
            // Load any controller resolves that aren't already loaded
            return resolveCtx.invokeLater($loadControllerLocals)
                .then(function () { return vc.locals = common_1.map(resolvables, function (res) { return res.data; }); });
        };
        var loadAllLocals = $transition$.views("entering").filter(function (vc) { return !!vc.controller; }).map(loadLocals);
        return coreservices_1.services.$q.all(loadAllLocals).then(common_1.noop);
    }
    router.transitionService.onFinish({}, loadAllControllerLocals);
    router.transitionService["$get"] = function () { return router.transitionService; };
    return router.transitionService;
}
angular.module('ui.router.state').provider('$transitions', ['ng1UIRouterProvider', getTransitionsProvider]);
// $templateFactory service
angular.module('ui.router.util').factory('$templateFactory', ['ng1UIRouter', function () { return new templateFactory_1.TemplateFactory(); }]);
// The $view service
angular.module('ui.router').factory('$view', function () { return router.viewService; });
// The old $resolve service
angular.module('ui.router').factory('$resolve', resolveFactory);
// $trace service
angular.module("ui.router").service("$trace", function () { return trace_1.trace; });
watchDigests.$inject = ['$rootScope'];
function watchDigests($rootScope) {
    $rootScope.$watch(function () { trace_1.trace.approximateDigests++; });
}
exports.watchDigests = watchDigests;
angular.module("ui.router").run(watchDigests);
//# sourceMappingURL=services.js.map