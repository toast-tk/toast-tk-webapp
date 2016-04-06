"use strict";
/** @module state */ /** for typedoc */
var hof_1 = require("../../common/hof");
var param_1 = require("../../params/param");
var rejectFactory_1 = require("../../transition/rejectFactory");
var targetState_1 = require("../targetState");
var viewHooks_1 = require("./viewHooks");
var enterExitHooks_1 = require("./enterExitHooks");
var resolveHooks_1 = require("./resolveHooks");
var coreservices_1 = require("../../common/coreservices");
/**
 * This class:
 *
 * * Takes a blank transition object and adds all the hooks necessary for it to behave like a state transition.
 *
 * * Runs the transition, returning a chained promise which:
 *   * transforms the resolved Transition.promise to the final destination state.
 *   * manages the rejected Transition.promise, checking for Dynamic or Redirected transitions
 *
 * * Registers a handler to update global $state data such as "active transitions" and "current state/params"
 *
 * * Registers view hooks, which maintain the list of active view configs and sync with/update the ui-views
 *
 * * Registers onEnter/onRetain/onExit hooks which delegate to the state's hooks of the same name, at the appropriate time
 *
 * * Registers eager and lazy resolve hooks
 */
var TransitionManager = (function () {
    function TransitionManager(transition, $transitions, $urlRouter, $view, // service
        $state, globals) {
        this.transition = transition;
        this.$transitions = $transitions;
        this.$urlRouter = $urlRouter;
        this.$view = $view;
        this.$state = $state;
        this.globals = globals;
        this.$q = coreservices_1.services.$q;
        this.viewHooks = new viewHooks_1.ViewHooks(transition, $view);
        this.enterExitHooks = new enterExitHooks_1.EnterExitHooks(transition);
        this.resolveHooks = new resolveHooks_1.ResolveHooks(transition);
        this.treeChanges = transition.treeChanges();
        this.registerUpdateGlobalState();
        this.viewHooks.registerHooks();
        this.enterExitHooks.registerHooks();
        this.resolveHooks.registerHooks();
    }
    TransitionManager.prototype.runTransition = function () {
        var _this = this;
        this.globals.transitionHistory.enqueue(this.transition);
        return this.transition.run()
            .then(function (trans) { return trans.to(); }) // resolve to the final state (TODO: good? bad?)
            .catch(function (error) { return _this.transRejected(error); }); // if rejected, handle dynamic and redirect
    };
    TransitionManager.prototype.registerUpdateGlobalState = function () {
        // After globals.current is updated at priority: 10000
        this.transition.onSuccess({}, this.updateUrl.bind(this), { priority: 9999 });
    };
    TransitionManager.prototype.transRejected = function (error) {
        var _a = this, transition = _a.transition, $state = _a.$state, $q = _a.$q;
        // Handle redirect and abort
        if (error instanceof rejectFactory_1.TransitionRejection) {
            if (error.type === rejectFactory_1.RejectType.IGNORED) {
                // Update $stateParmas/$state.params/$location.url if transition ignored, but dynamic params have changed.
                var dynamic = $state.$current.parameters().filter(hof_1.prop('dynamic'));
                if (!param_1.Param.equals(dynamic, $state.params, transition.params())) {
                    this.updateUrl();
                }
                return $state.current;
            }
            if (error.type === rejectFactory_1.RejectType.SUPERSEDED && error.redirected && error.detail instanceof targetState_1.TargetState) {
                return this._redirectMgr(transition.redirect(error.detail)).runTransition();
            }
            if (error.type === rejectFactory_1.RejectType.ABORTED) {
                this.$urlRouter.update();
            }
        }
        this.$transitions.defaultErrorHandler()(error);
        return $q.reject(error);
    };
    TransitionManager.prototype.updateUrl = function () {
        var transition = this.transition;
        var _a = this, $urlRouter = _a.$urlRouter, $state = _a.$state;
        var options = transition.options();
        var toState = transition.$to();
        if (options.location && $state.$current.navigable) {
            $urlRouter.push($state.$current.navigable.url, $state.params, { replace: options.location === 'replace' });
        }
        $urlRouter.update(true);
    };
    TransitionManager.prototype._redirectMgr = function (redirect) {
        var _a = this, $transitions = _a.$transitions, $urlRouter = _a.$urlRouter, $view = _a.$view, $state = _a.$state, globals = _a.globals;
        return new TransitionManager(redirect, $transitions, $urlRouter, $view, $state, globals);
    };
    return TransitionManager;
}());
exports.TransitionManager = TransitionManager;
//# sourceMappingURL=transitionManager.js.map