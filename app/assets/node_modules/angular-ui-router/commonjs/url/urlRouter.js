"use strict";
/** @module url */ /** for typedoc */
var common_1 = require("../common/common");
var predicates_1 = require("../common/predicates");
var coreservices_1 = require("../common/coreservices");
var $location = coreservices_1.services.location;
// Returns a string that is a prefix of all strings matching the RegExp
function regExpPrefix(re) {
    var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
    return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
}
// Interpolates matched values into a String.replace()-style pattern
function interpolate(pattern, match) {
    return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
        return match[what === '$' ? 0 : Number(what)];
    });
}
function handleIfMatch($injector, $stateParams, handler, match) {
    if (!match)
        return false;
    var result = $injector.invoke(handler, handler, { $match: match, $stateParams: $stateParams });
    return predicates_1.isDefined(result) ? result : true;
}
function appendBasePath(url, isHtml5, absolute) {
    var baseHref = coreservices_1.services.locationConfig.baseHref();
    if (baseHref === '/')
        return url;
    if (isHtml5)
        return baseHref.slice(0, -1) + url;
    if (absolute)
        return baseHref.slice(1) + url;
    return url;
}
// TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
function update(rules, otherwiseFn, evt) {
    if (evt && evt.defaultPrevented)
        return;
    function check(rule) {
        var handled = rule(coreservices_1.services.$injector, $location);
        if (!handled)
            return false;
        if (predicates_1.isString(handled)) {
            $location.replace();
            $location.url(handled);
        }
        return true;
    }
    var n = rules.length, i;
    for (i = 0; i < n; i++) {
        if (check(rules[i]))
            return;
    }
    // always check otherwise last to allow dynamic updates to the set of rules
    if (otherwiseFn)
        check(otherwiseFn);
}
/**
 * @ngdoc object
 * @name ui.router.router.$urlRouterProvider
 *
 * @requires ui.router.util.$urlMatcherFactoryProvider
 * @requires $locationProvider
 *
 * @description
 * `$urlRouterProvider` has the responsibility of watching `$location`.
 * When `$location` changes it runs through a list of rules one by one until a
 * match is found. `$urlRouterProvider` is used behind the scenes anytime you specify
 * a url in a state configuration. All urls are compiled into a UrlMatcher object.
 *
 * There are several methods on `$urlRouterProvider` that make it useful to use directly
 * in your module config.
 */
var UrlRouterProvider = (function () {
    function UrlRouterProvider($urlMatcherFactory, $stateParams) {
        this.$urlMatcherFactory = $urlMatcherFactory;
        this.$stateParams = $stateParams;
        /** @hidden */
        this.rules = [];
        /** @hidden */
        this.otherwiseFn = null;
        /** @hidden */
        this.interceptDeferred = false;
    }
    /**
     * @ngdoc function
     * @name ui.router.router.$urlRouterProvider#rule
     * @methodOf ui.router.router.$urlRouterProvider
     *
     * @description
     * Defines rules that are used by `$urlRouterProvider` to find matches for
     * specific URLs.
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router.router']);
     *
     * app.config(function ($urlRouterProvider) {
     *   // Here's an example of how you might allow case insensitive urls
     *   $urlRouterProvider.rule(function ($injector, $location) {
     *     var path = $location.path(),
     *         normalized = path.toLowerCase();
     *
     *     if (path !== normalized) {
     *       return normalized;
     *     }
     *   });
     * });
     * </pre>
     *
     * @param {function} rule Handler function that takes `$injector` and `$location`
     * services as arguments. You can use them to return a valid path as a string.
     *
     * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
     */
    UrlRouterProvider.prototype.rule = function (rule) {
        if (!predicates_1.isFunction(rule))
            throw new Error("'rule' must be a function");
        this.rules.push(rule);
        return this;
    };
    ;
    /**
     * @ngdoc object
     * @name ui.router.router.$urlRouterProvider#otherwise
     * @methodOf ui.router.router.$urlRouterProvider
     *
     * @description
     * Defines a path that is used when an invalid route is requested.
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router.router']);
     *
     * app.config(function ($urlRouterProvider) {
     *   // if the path doesn't match any of the urls you configured
     *   // otherwise will take care of routing the user to the
     *   // specified url
     *   $urlRouterProvider.otherwise('/index');
     *
     *   // Example of using function rule as param
     *   $urlRouterProvider.otherwise(function ($injector, $location) {
     *     return '/a/valid/url';
     *   });
     * });
     * </pre>
     *
     * @param {string|function} rule The url path you want to redirect to or a function
     * rule that returns the url path. The function version is passed two params:
     * `$injector` and `$location` services, and must return a url string.
     *
     * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
     */
    UrlRouterProvider.prototype.otherwise = function (rule) {
        if (!predicates_1.isFunction(rule) && !predicates_1.isString(rule))
            throw new Error("'rule' must be a string or function");
        this.otherwiseFn = predicates_1.isString(rule) ? function () { return rule; } : rule;
        return this;
    };
    ;
    /**
     * @ngdoc function
     * @name ui.router.router.$urlRouterProvider#when
     * @methodOf ui.router.router.$urlRouterProvider
     *
     * @description
     * Registers a handler for a given url matching.
     *
     * If the handler is a string, it is
     * treated as a redirect, and is interpolated according to the syntax of match
     * (i.e. like `String.replace()` for `RegExp`, or like a `UrlMatcher` pattern otherwise).
     *
     * If the handler is a function, it is injectable. It gets invoked if `$location`
     * matches. You have the option of inject the match object as `$match`.
     *
     * The handler can return
     *
     * - **falsy** to indicate that the rule didn't match after all, then `$urlRouter`
     *   will continue trying to find another one that matches.
     * - **string** which is treated as a redirect and passed to `$location.url()`
     * - **void** or any **truthy** value tells `$urlRouter` that the url was handled.
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router.router']);
     *
     * app.config(function ($urlRouterProvider) {
     *   $urlRouterProvider.when($state.url, function ($match, $stateParams) {
     *     if ($state.$current.navigable !== state ||
     *         !equalForKeys($match, $stateParams) {
     *      $state.transitionTo(state, $match, false);
     *     }
     *   });
     * });
     * </pre>
     *
     * @param {string|object} what The incoming path that you want to redirect.
     * @param {string|function} handler The path you want to redirect your user to.
     */
    UrlRouterProvider.prototype.when = function (what, handler) {
        var _a = this, $urlMatcherFactory = _a.$urlMatcherFactory, $stateParams = _a.$stateParams;
        var redirect, handlerIsString = predicates_1.isString(handler);
        // @todo Queue this
        if (predicates_1.isString(what))
            what = $urlMatcherFactory.compile(what);
        if (!handlerIsString && !predicates_1.isFunction(handler) && !predicates_1.isArray(handler))
            throw new Error("invalid 'handler' in when()");
        var strategies = {
            matcher: function (_what, _handler) {
                if (handlerIsString) {
                    redirect = $urlMatcherFactory.compile(_handler);
                    _handler = ['$match', redirect.format.bind(redirect)];
                }
                return common_1.extend(function () {
                    return handleIfMatch(coreservices_1.services.$injector, $stateParams, _handler, _what.exec($location.path(), $location.search(), $location.hash()));
                }, {
                    prefix: predicates_1.isString(_what.prefix) ? _what.prefix : ''
                });
            },
            regex: function (_what, _handler) {
                if (_what.global || _what.sticky)
                    throw new Error("when() RegExp must not be global or sticky");
                if (handlerIsString) {
                    redirect = _handler;
                    _handler = ['$match', function ($match) { return interpolate(redirect, $match); }];
                }
                return common_1.extend(function () {
                    return handleIfMatch(coreservices_1.services.$injector, $stateParams, _handler, _what.exec($location.path()));
                }, {
                    prefix: regExpPrefix(_what)
                });
            }
        };
        var check = {
            matcher: $urlMatcherFactory.isMatcher(what),
            regex: what instanceof RegExp
        };
        for (var n in check) {
            if (check[n])
                return this.rule(strategies[n](what, handler));
        }
        throw new Error("invalid 'what' in when()");
    };
    ;
    /**
     * @ngdoc function
     * @name ui.router.router.$urlRouterProvider#deferIntercept
     * @methodOf ui.router.router.$urlRouterProvider
     *
     * @description
     * Disables (or enables) deferring location change interception.
     *
     * If you wish to customize the behavior of syncing the URL (for example, if you wish to
     * defer a transition but maintain the current URL), call this method at configuration time.
     * Then, at run time, call `$urlRouter.listen()` after you have configured your own
     * `$locationChangeSuccess` event handler.
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router.router']);
     *
     * app.config(function ($urlRouterProvider) {
     *
     *   // Prevent $urlRouter from automatically intercepting URL changes;
     *   // this allows you to configure custom behavior in between
     *   // location changes and route synchronization:
     *   $urlRouterProvider.deferIntercept();
     *
     * }).run(function ($rootScope, $urlRouter, UserService) {
     *
     *   $rootScope.$on('$locationChangeSuccess', function(e) {
     *     // UserService is an example service for managing user state
     *     if (UserService.isLoggedIn()) return;
     *
     *     // Prevent $urlRouter's default handler from firing
     *     e.preventDefault();
     *
     *     UserService.handleLogin().then(function() {
     *       // Once the user has logged in, sync the current URL
     *       // to the router:
     *       $urlRouter.sync();
     *     });
     *   });
     *
     *   // Configures $urlRouter's listener *after* your custom listener
     *   $urlRouter.listen();
     * });
     * </pre>
     *
     * @param {boolean} defer Indicates whether to defer location change interception. Passing
     *        no parameter is equivalent to `true`.
     */
    UrlRouterProvider.prototype.deferIntercept = function (defer) {
        if (defer === undefined)
            defer = true;
        this.interceptDeferred = defer;
    };
    ;
    return UrlRouterProvider;
}());
exports.UrlRouterProvider = UrlRouterProvider;
var UrlRouter = (function () {
    function UrlRouter(urlRouterProvider) {
        this.urlRouterProvider = urlRouterProvider;
        common_1.bindFunctions(UrlRouter.prototype, this, this);
    }
    /**
     * @ngdoc function
     * @name ui.router.router.$urlRouter#sync
     * @methodOf ui.router.router.$urlRouter
     *
     * @description
     * Triggers an update; the same update that happens when the address bar url changes, aka `$locationChangeSuccess`.
     * This method is useful when you need to use `preventDefault()` on the `$locationChangeSuccess` event,
     * perform some custom logic (route protection, auth, config, redirection, etc) and then finally proceed
     * with the transition by calling `$urlRouter.sync()`.
     *
     * @example
     * <pre>
     * angular.module('app', ['ui.router'])
     *   .run(function($rootScope, $urlRouter) {
     *     $rootScope.$on('$locationChangeSuccess', function(evt) {
     *       // Halt state change from even starting
     *       evt.preventDefault();
     *       // Perform custom logic
     *       var meetsRequirement = ...
     *       // Continue with the update and state transition if logic allows
     *       if (meetsRequirement) $urlRouter.sync();
     *     });
     * });
     * </pre>
     */
    UrlRouter.prototype.sync = function () {
        update(this.urlRouterProvider.rules, this.urlRouterProvider.otherwiseFn);
    };
    UrlRouter.prototype.listen = function () {
        var _this = this;
        return this.listener = this.listener || $location.onChange(function (evt) { return update(_this.urlRouterProvider.rules, _this.urlRouterProvider.otherwiseFn, evt); });
    };
    UrlRouter.prototype.update = function (read) {
        if (read) {
            this.location = $location.url();
            return;
        }
        if ($location.url() === this.location)
            return;
        $location.url(this.location);
        $location.replace();
    };
    UrlRouter.prototype.push = function (urlMatcher, params, options) {
        $location.url(urlMatcher.format(params || {}));
        if (options && options.replace)
            $location.replace();
    };
    /**
     * @ngdoc function
     * @name ui.router.router.$urlRouter#href
     * @methodOf ui.router.router.$urlRouter
     *
     * @description
     * A URL generation method that returns the compiled URL for a given
     * {@link ui.router.util.type:UrlMatcher `UrlMatcher`}, populated with the provided parameters.
     *
     * @example
     * <pre>
     * $bob = $urlRouter.href(new UrlMatcher("/about/:person"), {
     *   person: "bob"
     * });
     * // $bob == "/about/bob";
     * </pre>
     *
     * @param {UrlMatcher} urlMatcher The `UrlMatcher` object which is used as the template of the URL to generate.
     * @param {object=} params An object of parameter values to fill the matcher's required parameters.
     * @param {object=} options Options object. The options are:
     *
     * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
     *
     * @returns {string} Returns the fully compiled URL, or `null` if `params` fail validation against `urlMatcher`
     */
    UrlRouter.prototype.href = function (urlMatcher, params, options) {
        if (!urlMatcher.validates(params))
            return null;
        var url = urlMatcher.format(params);
        options = options || {};
        var cfg = coreservices_1.services.locationConfig;
        var isHtml5 = cfg.html5Mode();
        if (!isHtml5 && url !== null) {
            url = "#" + cfg.hashPrefix() + url;
        }
        url = appendBasePath(url, isHtml5, options.absolute);
        if (!options.absolute || !url) {
            return url;
        }
        var slash = (!isHtml5 && url ? '/' : ''), port = cfg.port();
        port = (port === 80 || port === 443 ? '' : ':' + port);
        return [cfg.protocol(), '://', cfg.host(), port, slash, url].join('');
    };
    return UrlRouter;
}());
exports.UrlRouter = UrlRouter;
//# sourceMappingURL=urlRouter.js.map