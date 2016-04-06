"use strict";
var EnterExitHooks = (function () {
    function EnterExitHooks(transition) {
        this.transition = transition;
    }
    EnterExitHooks.prototype.registerHooks = function () {
        this.registerOnEnterHooks();
        this.registerOnRetainHooks();
        this.registerOnExitHooks();
    };
    EnterExitHooks.prototype.registerOnEnterHooks = function () {
        var _this = this;
        this.transition.entering().filter(function (state) { return !!state.onEnter; })
            .forEach(function (state) { return _this.transition.onEnter({ entering: state.name }, state.onEnter); });
    };
    EnterExitHooks.prototype.registerOnRetainHooks = function () {
        var _this = this;
        this.transition.retained().filter(function (state) { return !!state.onRetain; })
            .forEach(function (state) { return _this.transition.onRetain({ retained: state.name }, state.onRetain); });
    };
    EnterExitHooks.prototype.registerOnExitHooks = function () {
        var _this = this;
        this.transition.exiting().filter(function (state) { return !!state.onExit; })
            .forEach(function (state) { return _this.transition.onExit({ exiting: state.name }, state.onExit); });
    };
    return EnterExitHooks;
}());
exports.EnterExitHooks = EnterExitHooks;
//# sourceMappingURL=enterExitHooks.js.map