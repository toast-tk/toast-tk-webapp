"use strict";
/** @module state */ /** for typedoc */
var common_1 = require("../../common/common");
var hof_1 = require("../../common/hof");
var interface_1 = require("../../resolve/interface");
var hof_2 = require("../../common/hof");
var resolvable_1 = require("../../resolve/resolvable");
var LAZY = interface_1.ResolvePolicy[interface_1.ResolvePolicy.LAZY];
var EAGER = interface_1.ResolvePolicy[interface_1.ResolvePolicy.EAGER];
/**
 * Registers Eager and Lazy (for entering states) resolve hooks
 *
 * * registers a hook that resolves EAGER resolves, for the To Path, onStart of the transition
 * * registers a hook that resolves LAZY resolves, for each state, before it is entered
 */
var ResolveHooks = (function () {
    function ResolveHooks(transition) {
        this.transition = transition;
    }
    ResolveHooks.prototype.registerHooks = function () {
        var treeChanges = this.transition.treeChanges();
        /** a function which resolves any EAGER Resolvables for a Path */
        $eagerResolvePath.$inject = ['$transition$'];
        function $eagerResolvePath($transition$) {
            return common_1.tail(treeChanges.to).resolveContext.resolvePath(common_1.extend({ transition: $transition$ }, { resolvePolicy: EAGER }));
        }
        /** Returns a function which pre-resolves any LAZY Resolvables for a Node in a Path */
        $lazyResolveEnteringState.$inject = ['$state$', '$transition$'];
        function $lazyResolveEnteringState($state$, $transition$) {
            var node = common_1.find(treeChanges.entering, hof_1.propEq('state', $state$));
            // A new Resolvable contains all the resolved data in this context as a single object, for injection as `$resolve$`
            var context = node.resolveContext;
            var $resolve$ = new resolvable_1.Resolvable("$resolve$", function () { return common_1.map(context.getResolvables(), function (r) { return r.data; }); });
            var options = common_1.extend({ transition: $transition$ }, { resolvePolicy: LAZY });
            // Resolve all the LAZY resolves, then resolve the `$resolve$` object, then add `$resolve$` to the context
            return context.resolvePathElement(node.state, options)
                .then(function () { return $resolve$.resolveResolvable(context); })
                .then(function () { return context.addResolvables({ $resolve$: $resolve$ }, node.state); });
        }
        // Resolve eager resolvables before when the transition starts
        this.transition.onStart({}, $eagerResolvePath, { priority: 1000 });
        // Resolve lazy resolvables before each state is entered
        this.transition.onEnter({ entering: hof_2.val(true) }, $lazyResolveEnteringState, { priority: 1000 });
    };
    return ResolveHooks;
}());
exports.ResolveHooks = ResolveHooks;
//# sourceMappingURL=resolveHooks.js.map