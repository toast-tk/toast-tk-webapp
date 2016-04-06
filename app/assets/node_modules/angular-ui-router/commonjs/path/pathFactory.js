/** @module path */ /** for typedoc */
"use strict";
var common_1 = require("../common/common");
var hof_1 = require("../common/hof");
var module_1 = require("../state/module");
var node_1 = require("../path/node");
var module_2 = require("../resolve/module");
/**
 * This class contains functions which convert TargetStates, Nodes and paths from one type to another.
 */
var PathFactory = (function () {
    function PathFactory() {
    }
    /** Given a Node[], create an TargetState */
    PathFactory.makeTargetState = function (path) {
        var state = common_1.tail(path).state;
        return new module_1.TargetState(state, state, path.map(hof_1.prop("paramValues")).reduce(common_1.mergeR, {}));
    };
    PathFactory.buildPath = function (targetState) {
        var toParams = targetState.params();
        return targetState.$state().path.map(function (state) { return new node_1.Node(state).applyRawParams(toParams); });
    };
    /** Given a fromPath: Node[] and a TargetState, builds a toPath: Node[] */
    PathFactory.buildToPath = function (fromPath, targetState) {
        var toPath = PathFactory.buildPath(targetState);
        if (targetState.options().inherit) {
            return PathFactory.inheritParams(fromPath, toPath, Object.keys(targetState.params()));
        }
        return toPath;
    };
    PathFactory.applyViewConfigs = function ($view, path) {
        return path.map(function (node) {
            return common_1.extend(node, { views: common_1.values(node.state.views || {}).map(function (view) { return $view.createViewConfig(node, view); }) });
        });
    };
    /**
     * Given a fromPath and a toPath, returns a new to path which inherits parameters from the fromPath
     *
     * For a parameter in a node to be inherited from the from path:
     * - The toPath's node must have a matching node in the fromPath (by state).
     * - The parameter name must not be found in the toKeys parameter array.
     *
     * Note: the keys provided in toKeys are intended to be those param keys explicitly specified by some
     * caller, for instance, $state.transitionTo(..., toParams).  If a key was found in toParams,
     * it is not inherited from the fromPath.
     */
    PathFactory.inheritParams = function (fromPath, toPath, toKeys) {
        if (toKeys === void 0) { toKeys = []; }
        function nodeParamVals(path, state) {
            var node = common_1.find(path, hof_1.propEq('state', state));
            return common_1.extend({}, node && node.paramValues);
        }
        /**
         * Given an Node "toNode", return a new Node with param values inherited from the
         * matching node in fromPath.  Only inherit keys that aren't found in "toKeys" from the node in "fromPath""
         */
        var makeInheritedParamsNode = hof_1.curry(function (_fromPath, _toKeys, toNode) {
            // All param values for the node (may include default key/vals, when key was not found in toParams)
            var toParamVals = common_1.extend({}, toNode && toNode.paramValues);
            // limited to only those keys found in toParams
            var incomingParamVals = common_1.pick(toParamVals, _toKeys);
            toParamVals = common_1.omit(toParamVals, _toKeys);
            var fromParamVals = nodeParamVals(_fromPath, toNode.state) || {};
            // extend toParamVals with any fromParamVals, then override any of those those with incomingParamVals
            var ownParamVals = common_1.extend(toParamVals, fromParamVals, incomingParamVals);
            return new node_1.Node(toNode.state).applyRawParams(ownParamVals);
        });
        // The param keys specified by the incoming toParams
        return toPath.map(makeInheritedParamsNode(fromPath, toKeys));
    };
    /**
     * Given a path, upgrades the path to a Node[].  Each node is assigned a ResolveContext
     * and ParamValues object which is bound to the whole path, but closes over the subpath from root to the node.
     * The views are also added to the node.
     */
    PathFactory.bindTransNodesToPath = function (resolvePath) {
        var resolveContext = new module_2.ResolveContext(resolvePath);
        // let paramValues = new ParamValues(resolvePath);
        // Attach bound resolveContext and paramValues to each node
        // Attach views to each node
        resolvePath.forEach(function (node) {
            node.resolveContext = resolveContext.isolateRootTo(node.state);
            node.resolveInjector = new module_2.ResolveInjector(node.resolveContext, node.state);
            node.resolves['$stateParams'] = new module_2.Resolvable("$stateParams", function () { return node.paramValues; }, node.paramValues);
        });
        return resolvePath;
    };
    /**
     * Computes the tree changes (entering, exiting) between a fromPath and toPath.
     */
    PathFactory.treeChanges = function (fromPath, toPath, reloadState) {
        var keep = 0, max = Math.min(fromPath.length, toPath.length);
        var staticParams = function (state) { return state.parameters({ inherit: false }).filter(hof_1.not(hof_1.prop('dynamic'))).map(hof_1.prop('id')); };
        var nodesMatch = function (node1, node2) { return node1.equals(node2, staticParams(node1.state)); };
        while (keep < max && fromPath[keep].state !== reloadState && nodesMatch(fromPath[keep], toPath[keep])) {
            keep++;
        }
        /** Given a retained node, return a new node which uses the to node's param values */
        function applyToParams(retainedNode, idx) {
            var cloned = node_1.Node.clone(retainedNode);
            cloned.paramValues = toPath[idx].paramValues;
            return cloned;
        }
        var from, retained, exiting, entering, to;
        // intermediate vars
        var retainedWithToParams, enteringResolvePath, toResolvePath;
        from = fromPath;
        retained = from.slice(0, keep);
        exiting = from.slice(keep);
        // Create a new retained path (with shallow copies of nodes) which have the params of the toPath mapped
        retainedWithToParams = retained.map(applyToParams);
        enteringResolvePath = toPath.slice(keep);
        // "toResolvePath" is "retainedWithToParams" concat "enteringResolvePath".
        toResolvePath = (retainedWithToParams).concat(enteringResolvePath);
        // "to: is "toResolvePath" with ParamValues/ResolveContext added to each node and bound to the path context
        to = PathFactory.bindTransNodesToPath(toResolvePath);
        // "entering" is the tail of "to"
        entering = to.slice(keep);
        return { from: from, to: to, retained: retained, exiting: exiting, entering: entering };
    };
    PathFactory.bindTransitionResolve = function (treeChanges, transition) {
        var rootNode = treeChanges.to[0];
        rootNode.resolves['$transition$'] = new module_2.Resolvable('$transition$', function () { return transition; }, transition);
    };
    /**
     * Find a subpath of a path that stops at the node for a given state
     *
     * Given an array of nodes, returns a subset of the array starting from the first node, up to the
     * node whose state matches `stateName`
     *
     * @param path a path of [[Node]]s
     * @param state the [[State]] to stop at
     */
    PathFactory.subPath = function (path, state) {
        var node = common_1.find(path, function (_node) { return _node.state === state; });
        var elementIdx = path.indexOf(node);
        if (elementIdx === -1)
            throw new Error("The path does not contain the state: " + state);
        return path.slice(0, elementIdx + 1);
    };
    /** Gets the raw parameter values from a path */
    PathFactory.paramValues = function (path) { return path.reduce(function (acc, node) { return common_1.extend(acc, node.paramValues); }, {}); };
    return PathFactory;
}());
exports.PathFactory = PathFactory;
//# sourceMappingURL=pathFactory.js.map