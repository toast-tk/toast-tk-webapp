/** @module state */ /** for typedoc */
"use strict";
var stateMatcher_1 = require("./stateMatcher");
var stateBuilder_1 = require("./stateBuilder");
var stateQueueManager_1 = require("./stateQueueManager");
var StateRegistry = (function () {
    function StateRegistry(urlMatcherFactory, urlRouterProvider) {
        this.states = {};
        this.matcher = new stateMatcher_1.StateMatcher(this.states);
        this.builder = new stateBuilder_1.StateBuilder(this.matcher, urlMatcherFactory);
        this.stateQueue = new stateQueueManager_1.StateQueueManager(this.states, this.builder, urlRouterProvider);
        var rootStateDef = {
            name: '',
            url: '^',
            views: null,
            params: {
                '#': { value: null, type: 'hash' }
            },
            abstract: true
        };
        var _root = this._root = this.stateQueue.register(rootStateDef);
        _root.navigable = null;
    }
    StateRegistry.prototype.root = function () {
        return this._root;
    };
    StateRegistry.prototype.register = function (stateDefinition) {
        return this.stateQueue.register(stateDefinition);
    };
    StateRegistry.prototype.get = function (stateOrName, base) {
        var _this = this;
        if (arguments.length === 0)
            return Object.keys(this.states).map(function (name) { return _this.states[name].self; });
        var found = this.matcher.find(stateOrName, base);
        return found && found.self || null;
    };
    StateRegistry.prototype.decorator = function (name, func) {
        return this.builder.builder(name, func);
    };
    return StateRegistry;
}());
exports.StateRegistry = StateRegistry;
//# sourceMappingURL=stateRegistry.js.map