/** @module transition */ /** for typedoc */
import { IInjectable } from "../common/common";
import { HookRegOptions, HookMatchCriteria, IEventHook, IHookRegistry, TreeChanges, HookMatchCriterion, IMatchingNodes } from "./interface";
import { State } from "../state/stateObject";
/**
 * Determines if the given state matches the matchCriteria
 * @param state a State Object to test against
 * @param criterion
 * - If a string, matchState uses the string as a glob-matcher against the state name
 * - If an array (of strings), matchState uses each string in the array as a glob-matchers against the state name
 *   and returns a positive match if any of the globs match.
 * - If a function, matchState calls the function with the state and returns true if the function's result is truthy.
 * @returns {boolean}
 */
export declare function matchState(state: State, criterion: HookMatchCriterion): boolean;
export declare class EventHook implements IEventHook {
    callback: IInjectable;
    matchCriteria: HookMatchCriteria;
    priority: number;
    bind: any;
    constructor(matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions);
    private static _matchingNodes(nodes, criterion);
    /**
     * Determines if this hook's [[matchCriteria]] match the given [[TreeChanges]]
     *
     * @returns an IMatchingNodes object, or null. If an IMatchingNodes object is returned, its values
     * are the matching [[Node]]s for each [[HookMatchCriterion]] (to, from, exiting, retained, entering)
     */
    matches(treeChanges: TreeChanges): IMatchingNodes;
}
export declare class HookRegistry implements IHookRegistry {
    static mixin(source: HookRegistry, target: IHookRegistry): void;
    private _transitionEvents;
    getHooks: (name: string) => IEventHook[];
    onBefore: (matchCriteria: HookMatchCriteria, callback: Function | any[], options?: HookRegOptions) => Function;
    onStart: (matchCriteria: HookMatchCriteria, callback: Function | any[], options?: HookRegOptions) => Function;
    /**
     * @ngdoc function
     * @name ui.router.state.$transitionsProvider#onEnter
     * @methodOf ui.router.state.$transitionsProvider
     *
     * @description
     * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from' states,
     * when the matched 'to' state is being entered. This function is injected with the entering state's resolves.
     *
     * This function can be injected with two additional special value:
     * - **`$transition$`**: The current transition
     * - **`$state$`**: The state being entered
     *
     * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     * @param {function} callback See callback in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     */
    onEnter: (matchCriteria: HookMatchCriteria, callback: Function | any[], options?: HookRegOptions) => Function;
    /**
     * @ngdoc function
     * @name ui.router.state.$transitionsProvider#onRetain
     * @methodOf ui.router.state.$transitionsProvider
     *
     * @description
     * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from states,
     * when the matched 'from' state is already active and is not being exited nor entered.
     *
     * This function can be injected with two additional special value:
     * - **`$transition$`**: The current transition
     * - **`$state$`**: The state that is retained
     *
     * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     * @param {function} callback See callback in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     */
    onRetain: (matchCriteria: HookMatchCriteria, callback: Function | any[], options?: HookRegOptions) => Function;
    /**
     * @ngdoc function
     * @name ui.router.state.$transitionsProvider#onExit
     * @methodOf ui.router.state.$transitionsProvider
     *
     * @description
     * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from states,
     * when the matched 'from' state is being exited. This function is in injected with the exiting state's resolves.
     *
     * This function can be injected with two additional special value:
     * - **`$transition$`**: The current transition
     * - **`$state$`**: The state being entered
     *
     * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     * @param {function} callback See callback in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     */
    onExit: (matchCriteria: HookMatchCriteria, callback: Function | any[], options?: HookRegOptions) => Function;
    /**
     * @ngdoc function
     * @name ui.router.state.$transitionsProvider#onFinish
     * @methodOf ui.router.state.$transitionsProvider
     *
     * @description
     * Registers a function to be injected and invoked when a transition is finished entering/exiting all states.
     *
     * This function can be injected with:
     * - **`$transition$`**: The current transition
     *
     * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     * @param {function} callback See callback in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     */
    onFinish: (matchCriteria: HookMatchCriteria, callback: Function | any[], options?: HookRegOptions) => Function;
    /**
     * @ngdoc function
     * @name ui.router.state.$transitionsProvider#onSuccess
     * @methodOf ui.router.state.$transitionsProvider
     *
     * @description
     * Registers a function to be injected and invoked when a transition has successfully completed between the matched
     * 'to' and 'from' state is being exited.
     * This function is in injected with the 'to' state's resolves (note: `JIT` resolves are not injected).
     *
     * This function can be injected with two additional special value:
     * - **`$transition$`**: The current transition
     *
     * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
     *   The function's return value is ignored.
     */
    onSuccess: (matchCriteria: HookMatchCriteria, callback: Function | any[], options?: HookRegOptions) => Function;
    /**
     * @ngdoc function
     * @name ui.router.state.$transitionsProvider#onError
     * @methodOf ui.router.state.$transitionsProvider
     *
     * @description
     * Registers a function to be injected and invoked when a transition has failed for any reason between the matched
     * 'to' and 'from' state. The transition rejection reason is injected as `$error$`.
     *
     * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
     * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
     *   The function's return value is ignored.
     */
    onError: (matchCriteria: HookMatchCriteria, callback: Function | any[], options?: HookRegOptions) => Function;
}
