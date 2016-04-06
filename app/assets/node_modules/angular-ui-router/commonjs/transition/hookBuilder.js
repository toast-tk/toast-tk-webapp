/** @module transition */ /** for typedoc */
"use strict";
var common_1 = require("../common/common");
var predicates_1 = require("../common/predicates");
var module_1 = require("./module");
/**
 * This class returns applicable TransitionHooks for a specific Transition instance.
 *
 * Hooks (IEventHook) may be registered globally, e.g., $transitions.onEnter(...), or locally, e.g.
 * myTransition.onEnter(...).  The HookBuilder finds matching IEventHooks (where the match criteria is
 * determined by the type of hook)
 *
 * The HookBuilder also converts IEventHooks objects to TransitionHook objects, which are used to run a Transition.
 *
 * The HookBuilder constructor is given the $transitions service and a Transition instance.  Thus, a HookBuilder
 * instance may only be used for one specific Transition object. (side note: the _treeChanges accessor is private
 * in the Transition class, so we must also provide the Transition's _treeChanges)
 *
 */
var HookBuilder = (function () {
    function HookBuilder($transitions, transition, baseHookOptions) {
        var _this = this;
        this.$transitions = $transitions;
        this.transition = transition;
        this.baseHookOptions = baseHookOptions;
        // TODO: These get* methods are returning different cardinalities of hooks
        // onBefore/onStart/onFinish/onSuccess/onError returns an array of hooks
        // onExit/onRetain/onEnter returns an array of arrays of hooks
        this.getOnBeforeHooks = function () { return _this._buildNodeHooks("onBefore", "to", tupleSort(), undefined, { async: false }); };
        this.getOnStartHooks = function () { return _this._buildNodeHooks("onStart", "to", tupleSort()); };
        this.getOnExitHooks = function () { return _this._buildNodeHooks("onExit", "exiting", tupleSort(true), function (node) { return ({ $state$: node.state }); }); };
        this.getOnRetainHooks = function () { return _this._buildNodeHooks("onRetain", "retained", tupleSort(), function (node) { return ({ $state$: node.state }); }); };
        this.getOnEnterHooks = function () { return _this._buildNodeHooks("onEnter", "entering", tupleSort(), function (node) { return ({ $state$: node.state }); }); };
        this.getOnFinishHooks = function () { return _this._buildNodeHooks("onFinish", "to", tupleSort(), function (node) { return ({ $treeChanges$: _this.treeChanges }); }); };
        this.getOnSuccessHooks = function () { return _this._buildNodeHooks("onSuccess", "to", tupleSort(), undefined, { async: false, rejectIfSuperseded: false }); };
        this.getOnErrorHooks = function () { return _this._buildNodeHooks("onError", "to", tupleSort(), undefined, { async: false, rejectIfSuperseded: false }); };
        this.treeChanges = transition.treeChanges();
        this.toState = common_1.tail(this.treeChanges.to).state;
        this.fromState = common_1.tail(this.treeChanges.from).state;
        this.transitionOptions = transition.options();
    }
    HookBuilder.prototype.asyncHooks = function () {
        var onStartHooks = this.getOnStartHooks();
        var onExitHooks = this.getOnExitHooks();
        var onRetainHooks = this.getOnRetainHooks();
        var onEnterHooks = this.getOnEnterHooks();
        var onFinishHooks = this.getOnFinishHooks();
        var asyncHooks = [onStartHooks, onExitHooks, onRetainHooks, onEnterHooks, onFinishHooks];
        return asyncHooks.reduce(common_1.unnestR, []).filter(common_1.identity);
    };
    /**
     * Returns an array of newly built TransitionHook objects.
     *
     * - Finds all IEventHooks registered for the given `hookType` which matched the transition's [[TreeChanges]].
     * - Finds [[Node]] (or `Node[]`) to use as the TransitionHook context(s)
     * - For each of the [[Node]]s, creates a TransitionHook
     *
     * @param hookType the name of the hook registration function, e.g., 'onEnter', 'onFinish'.
     * @param matchingNodesProp selects which [[Node]]s from the [[IMatchingNodes]] object to create hooks for.
     * @param getLocals a function which accepts a [[Node]] and returns additional locals to provide to the hook as injectables
     * @param sortHooksFn a function which compares two HookTuple and returns <1, 0, or >1
     * @param options any specific Transition Hook Options
     */
    HookBuilder.prototype._buildNodeHooks = function (hookType, matchingNodesProp, sortHooksFn, getLocals, options) {
        var _this = this;
        if (getLocals === void 0) { getLocals = function (node) { return ({}); }; }
        // Find all the matching registered hooks for a given hook type
        var matchingHooks = this._matchingHooks(hookType, this.treeChanges);
        if (!matchingHooks)
            return [];
        var makeTransitionHooks = function (hook) {
            // Fetch the Nodes that caused this hook to match.
            var matches = hook.matches(_this.treeChanges);
            // Select the Node[] that will be used as TransitionHook context objects
            var nodes = matches[matchingNodesProp];
            // Return an array of HookTuples
            return nodes.map(function (node) {
                var _options = common_1.extend({ bind: hook.bind, traceData: { hookType: hookType, context: node } }, _this.baseHookOptions, options);
                var transitionHook = new module_1.TransitionHook(hook.callback, getLocals(node), node.resolveContext, _options);
                return { hook: hook, node: node, transitionHook: transitionHook };
            });
        };
        return matchingHooks.map(makeTransitionHooks)
            .reduce(common_1.unnestR, [])
            .sort(sortHooksFn)
            .map(function (tuple) { return tuple.transitionHook; });
    };
    /**
     * Finds all IEventHooks from:
     * - The Transition object instance hook registry
     * - The TransitionService ($transitions) global hook registry
     *
     * which matched:
     * - the eventType
     * - the matchCriteria (to, from, exiting, retained, entering)
     *
     * @returns an array of matched [[IEventHook]]s
     */
    HookBuilder.prototype._matchingHooks = function (hookName, treeChanges) {
        return [this.transition, this.$transitions] // Instance and Global hook registries
            .map(function (reg) { return reg.getHooks(hookName); }) // Get named hooks from registries
            .filter(common_1.assertPredicate(predicates_1.isArray, "broken event named: " + hookName)) // Sanity check
            .reduce(common_1.unnestR, []) // Un-nest IEventHook[][] to IEventHook[] array
            .filter(function (hook) { return hook.matches(treeChanges); }); // Only those satisfying matchCriteria
    };
    return HookBuilder;
}());
exports.HookBuilder = HookBuilder;
/**
 * A factory for a sort function for HookTuples.
 *
 * The sort function first compares the Node depth (how deep in the state tree a node is), then compares
 * the EventHook priority.
 *
 * @param reverseDepthSort a boolean, when true, reverses the sort order for the node depth
 * @returns a tuple sort function
 */
function tupleSort(reverseDepthSort) {
    if (reverseDepthSort === void 0) { reverseDepthSort = false; }
    return function nodeDepthThenPriority(l, r) {
        var factor = reverseDepthSort ? -1 : 1;
        var depthDelta = (l.node.state.path.length - r.node.state.path.length) * factor;
        return depthDelta !== 0 ? depthDelta : r.hook.priority - l.hook.priority;
    };
}
//# sourceMappingURL=hookBuilder.js.map