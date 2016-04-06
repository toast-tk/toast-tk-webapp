"use strict";
/** @module state */ /** for typedoc */
var common_1 = require("../../common/common");
var coreservices_1 = require("../../common/coreservices");
var ViewHooks = (function () {
    function ViewHooks(transition, $view) {
        this.transition = transition;
        this.$view = $view;
        this.treeChanges = transition.treeChanges();
        this.enteringViews = transition.views("entering");
        this.exitingViews = transition.views("exiting");
    }
    ViewHooks.prototype.loadAllEnteringViews = function () {
        return coreservices_1.services.$q.all(this.enteringViews.map(function (view) { return view.load(); })).then(common_1.noop);
    };
    ViewHooks.prototype.updateViews = function () {
        var $view = this.$view;
        this.exitingViews.forEach(function (viewConfig) { return $view.deactivateViewConfig(viewConfig); });
        this.enteringViews.forEach(function (viewConfig) { return $view.activateViewConfig(viewConfig); });
        $view.sync();
    };
    ViewHooks.prototype.registerHooks = function () {
        if (this.enteringViews.length) {
            this.transition.onStart({}, this.loadAllEnteringViews.bind(this));
        }
        if (this.exitingViews.length || this.enteringViews.length)
            this.transition.onSuccess({}, this.updateViews.bind(this));
    };
    return ViewHooks;
}());
exports.ViewHooks = ViewHooks;
//# sourceMappingURL=viewHooks.js.map