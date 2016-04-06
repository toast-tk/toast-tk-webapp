import { UrlMatcher } from "./module";
import { UrlMatcherFactory } from "./urlMatcherFactory";
import { StateParams } from "../params/stateParams";
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
export declare class UrlRouterProvider {
    private $urlMatcherFactory;
    private $stateParams;
    /** @hidden */
    rules: any[];
    /** @hidden */
    otherwiseFn: Function;
    /** @hidden */
    interceptDeferred: boolean;
    constructor($urlMatcherFactory: UrlMatcherFactory, $stateParams: StateParams);
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
    rule(rule: any): this;
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
    otherwise(rule: any): this;
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
    when(what: any, handler: any): this;
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
    deferIntercept(defer: any): void;
}
export declare class UrlRouter {
    private urlRouterProvider;
    private location;
    private listener;
    constructor(urlRouterProvider: UrlRouterProvider);
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
    sync(): void;
    listen(): Function;
    update(read?: any): void;
    push(urlMatcher: any, params: any, options: any): void;
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
    href(urlMatcher: UrlMatcher, params: any, options: any): string;
}
