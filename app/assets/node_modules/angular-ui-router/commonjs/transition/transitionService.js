"use strict";
var transition_1 = require("./transition");
var hookRegistry_1 = require("./hookRegistry");
/**
 * The default transition options.
 * Include this object when applying custom defaults:
 * let reloadOpts = { reload: true, notify: true }
 * let options = defaults(theirOpts, customDefaults, defaultOptions);
 */
exports.defaultTransOpts = {
    location: true,
    relative: null,
    inherit: false,
    notify: true,
    reload: false,
    custom: {},
    current: function () { return null; }
};
/**
 * This class provides services related to Transitions.
 *
 * Most importantly, it allows global Transition Hooks to be registered, and has a factory function
 * for creating new Transitions.
 */
var TransitionService = (function () {
    function TransitionService($view) {
        this.$view = $view;
        this._defaultErrorHandler = function $defaultErrorHandler($error$) {
            if ($error$ instanceof Error) {
                console.error($error$);
            }
        };
        hookRegistry_1.HookRegistry.mixin(new hookRegistry_1.HookRegistry(), this);
    }
    TransitionService.prototype.defaultErrorHandler = function (handler) {
        return this._defaultErrorHandler = handler || this._defaultErrorHandler;
    };
    /**
     * Creates a new [[Transition]] object
     *
     * This is a factory function for creating new Transition objects.
     *
     * @param fromPath
     * @param targetState
     * @returns {Transition}
     */
    TransitionService.prototype.create = function (fromPath, targetState) {
        return new transition_1.Transition(fromPath, targetState, this);
    };
    return TransitionService;
}());
exports.TransitionService = TransitionService;
//# sourceMappingURL=transitionService.js.map