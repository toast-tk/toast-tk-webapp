"use strict";
/** @module core */ /** */
var stateParams_1 = require("./params/stateParams");
var queue_1 = require("./common/queue");
var common_1 = require("./common/common");
/**
 * Global mutable state
 *
 * This is where we hold the global mutable state such as current state, current
 * params, current transition, last successful transition, last attempted transition, etc.
 */
var UIRouterGlobals = (function () {
    function UIRouterGlobals(transitionService) {
        var _this = this;
        /**
         * Current parameter values
         *
         * The parameter values from the latest successful transition
         */
        this.params = new stateParams_1.StateParams();
        /**
         * The transition history
         *
         * This queue's size is limited to a maximum number (default: 1)
         */
        this.transitionHistory = new queue_1.Queue([], 1);
        /**
         * The history of successful transitions
         *
         * This queue's size is limited to a maximum number (default: 1)
         */
        this.successfulTransitions = new queue_1.Queue([], 1);
        var beforeNewTransition = function ($transition$) {
            _this.transition = $transition$;
            _this.transitionHistory.enqueue($transition$);
            var updateGlobalState = function () {
                _this.successfulTransitions.enqueue($transition$);
                _this.$current = $transition$.$to();
                _this.current = _this.$current.self;
                common_1.copy($transition$.params(), _this.params);
            };
            $transition$.onSuccess({}, updateGlobalState, { priority: 10000 });
            var clearCurrentTransition = function () { if (_this.transition === $transition$)
                _this.transition = null; };
            $transition$.promise.then(clearCurrentTransition, clearCurrentTransition);
        };
        transitionService.onBefore({}, ['$transition$', beforeNewTransition]);
    }
    return UIRouterGlobals;
}());
exports.UIRouterGlobals = UIRouterGlobals;
//# sourceMappingURL=globals.js.map