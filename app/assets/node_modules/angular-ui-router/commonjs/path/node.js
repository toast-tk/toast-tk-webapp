"use strict";
/** @module path */ /** for typedoc */
var common_1 = require("../common/common");
var hof_1 = require("../common/hof");
var module_1 = require("../resolve/module");
var Node = (function () {
    function Node(state) {
        if (state instanceof Node) {
            var node = state;
            this.state = node.state;
            this.paramSchema = node.paramSchema.slice();
            this.paramValues = common_1.extend({}, node.paramValues);
            this.resolves = common_1.extend({}, node.resolves);
            this.views = node.views && node.views.slice();
            this.resolveContext = node.resolveContext;
            this.resolveInjector = node.resolveInjector;
        }
        else {
            this.state = state;
            this.paramSchema = state.parameters({ inherit: false });
            this.paramValues = {};
            this.resolves = common_1.mapObj(state.resolve, function (fn, name) { return new module_1.Resolvable(name, fn); });
        }
    }
    Node.prototype.applyRawParams = function (params) {
        var getParamVal = function (paramDef) { return [paramDef.id, paramDef.value(params[paramDef.id])]; };
        this.paramValues = this.paramSchema.reduce(function (memo, pDef) { return common_1.applyPairs(memo, getParamVal(pDef)); }, {});
        return this;
    };
    Node.prototype.parameter = function (name) {
        return common_1.find(this.paramSchema, hof_1.propEq("id", name));
    };
    Node.prototype.equals = function (node, keys) {
        var _this = this;
        if (keys === void 0) { keys = this.paramSchema.map(hof_1.prop('id')); }
        var paramValsEq = function (key) { return _this.parameter(key).type.equals(_this.paramValues[key], node.paramValues[key]); };
        return this.state === node.state && keys.map(paramValsEq).reduce(common_1.allTrueR, true);
    };
    Node.clone = function (node) {
        return new Node(node);
    };
    /**
     * Returns a new path which is a subpath of the first path. The new path starts from root and contains any nodes
     * that match the nodes in the second path. Nodes are compared using their state property.
     * @param first {Node[]}
     * @param second {Node[]}
     * @returns {Node[]}
     */
    Node.matching = function (first, second) {
        var matchedCount = first.reduce(function (prev, node, i) {
            return prev === i && i < second.length && node.state === second[i].state ? i + 1 : prev;
        }, 0);
        return first.slice(0, matchedCount);
    };
    return Node;
}());
exports.Node = Node;
//# sourceMappingURL=node.js.map