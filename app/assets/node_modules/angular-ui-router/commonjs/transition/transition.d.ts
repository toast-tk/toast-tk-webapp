import { StateDeclaration, StateOrName } from "../state/interface";
import { TransitionOptions, TreeChanges, IHookRegistry, IHookRegistration, IHookGetter } from "./interface";
import { HookBuilder } from "./module";
import { Node } from "../path/node";
import { State, TargetState } from "../state/module";
import { TransitionService } from "./transitionService";
import { ViewConfig } from "../view/interface";
/**
 * The representation of a transition between two states.
 *
 * Contains all contextual information about the to/from states, parameters, resolves, as well as the
 * list of states being entered and exited as a result of this transition.
 */
export declare class Transition implements IHookRegistry {
    private _transitionService;
    $id: number;
    success: boolean;
    private _deferred;
    /**
     * This promise is resolved or rejected based on the outcome of the Transition.
     *
     * When the transition is successful, the promise is resolved
     * When the transition is unsuccessful, the promise is rejected with the [[TransitionRejection]] or javascript error
     */
    promise: Promise<any>;
    private _options;
    private _treeChanges;
    /**
     * Registers a callback function as an `onBefore` Transition Hook
     *
     * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onBefore]]
     *
     * See [[IHookRegistry.onBefore]]
     */
    onBefore: IHookRegistration;
    /**
     * Registers a callback function as an `onStart` Transition Hook
     *
     * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onStart]]
     *
     * See [[IHookRegistry.onStart]]
     */
    onStart: IHookRegistration;
    /**
     * Registers a callback function as an `onEnter` State Hook
     *
     * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onEnter]]
     *
     * See [[IHookRegistry.onEnter]]
     */
    onEnter: IHookRegistration;
    /**
     * Registers a callback function as an `onRetain` State Hook
     *
     * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onRetain]]
     *
     * See [[IHookRegistry.onRetain]]
     */
    onRetain: IHookRegistration;
    /**
     * Registers a callback function as an `onExit` State Hook
     *
     * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onExit]]
     *
     * See [[IHookRegistry.onExit]]
     */
    onExit: IHookRegistration;
    /**
     * Registers a callback function as an `onFinish` Transition Hook
     *
     * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onFinish]]
     *
     * See [[IHookRegistry.onFinish]]
     */
    onFinish: IHookRegistration;
    /**
     * Registers a callback function as an `onSuccess` Transition Hook
     *
     * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onSuccess]]
     *
     * See [[IHookRegistry.onSuccess]]
     */
    onSuccess: IHookRegistration;
    /**
     * Registers a callback function as an `onError` Transition Hook
     *
     * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onError]]
     *
     * See [[IHookRegistry.onError]]
     */
    onError: IHookRegistration;
    getHooks: IHookGetter;
    /**
     * Creates a new Transition object.
     *
     * If the target state is not valid, an error is thrown.
     *
     * @param fromPath The path of [[Node]]s from which the transition is leaving.  The last node in the `fromPath`
     *        encapsulates the "from state".
     * @param targetState The target state and parameters being transitioned to (also, the transition options)
     * @param _transitionService The Transition Service instance
     */
    constructor(fromPath: Node[], targetState: TargetState, _transitionService: TransitionService);
    $from(): State;
    $to(): State;
    /**
     * Returns the "from state"
     *
     * @returns The state object for the Transition's "from state".
     */
    from(): StateDeclaration;
    /**
     * Returns the "to state"
     *
     * @returns The state object for the Transition's target state ("to state").
     */
    to(): StateDeclaration;
    /**
     * Determines whether two transitions are equivalent.
     */
    is(compare: (Transition | {
        to: any;
        from: any;
    })): boolean;
    /**
     * Gets transition parameter values
     *
     * @param pathname Pick which treeChanges path to get parameters for:
     *   (`'to'`, `'from'`, `'entering'`, `'exiting'`, `'retained'`)
     * @returns transition parameter values for the desired path.
     */
    params(pathname?: string): {
        [key: string]: any;
    };
    /**
     * Get resolved data
     *
     * @returns an object (key/value pairs) where keys are resolve names and values are any settled resolve data,
     *    or `undefined` for pending resolve data
     */
    resolves(): {
        [resolveName: string]: any;
    };
    /**
     * Adds new resolves to this transition.
     *
     * @param resolves an [[ResolveDeclarations]] object which describes the new resolves
     * @param state the state in the "to path" which should receive the new resolves (otherwise, the root state)
     */
    addResolves(resolves: {
        [key: string]: Function;
    }, state?: StateOrName): void;
    /**
     * Gets the previous transition, from which this transition was redirected.
     *
     * @returns The previous Transition, or null if this Transition is not the result of a redirection
     */
    previous(): Transition;
    /**
     * Get the transition options
     *
     * @returns the options for this Transition.
     */
    options(): TransitionOptions;
    /**
     * Gets the states being entered.
     *
     * @returns an array of states that will be entered during this transition.
     */
    entering(): StateDeclaration[];
    /**
     * Gets the states being exited.
     *
     * @returns an array of states that will be exited during this transition.
     */
    exiting(): StateDeclaration[];
    /**
     * Gets the states being retained.
     *
     * @returns an array of states that are already entered from a previous Transition, that will not be
     *    exited during this Transition
     */
    retained(): StateDeclaration[];
    /**
     * Get the [[ViewConfig]]s associated with this Transition
     *
     * Each state can define one or more views (template/controller), which are encapsulated as `ViewConfig` objects.
     * This method fetches the `ViewConfigs` for a given path in the Transition (e.g., "to" or "entering").
     *
     * @param pathname the name of the path to fetch views for:
     *   (`'to'`, `'from'`, `'entering'`, `'exiting'`, `'retained'`)
     * @param state If provided, only returns the `ViewConfig`s for a single state in the path
     *
     * @returns a list of ViewConfig objects for the given path.
     */
    views(pathname?: string, state?: State): ViewConfig[];
    treeChanges: () => TreeChanges;
    /**
     * @ngdoc function
     * @name ui.router.state.type:Transition#redirect
     * @methodOf ui.router.state.type:Transition
     *
     * @description
     * Creates a new transition that is a redirection of the current one. This transition can
     * be returned from a `$transitionsProvider` hook, `$state` event, or other method, to
     * redirect a transition to a new state and/or set of parameters.
     *
     * @returns {Transition} Returns a new `Transition` instance.
     */
    redirect(targetState: TargetState): Transition;
    /** @hidden If a transition doesn't exit/enter any states, returns any [[Param]] whose value changed */
    private _changedParams();
    /**
     * Returns true if the transition is dynamic.
     *
     * A transition is dynamic if no states are entered nor exited, but at least one dynamic parameter has changed.
     *
     * @returns true if the Transition is dynamic
     */
    dynamic(): boolean;
    /**
     * Returns true if the transition is ignored.
     *
     * A transition is ignored if no states are entered nor exited, and no parameter values have changed.
     *
     * @returns true if the Transition is ignored.
     */
    ignored(): boolean;
    /**
     * @hidden
     */
    hookBuilder(): HookBuilder;
    /**
     * Runs the transition
     *
     * This method is generally called from the [[StateService.transitionTo]]
     *
     * @returns a promise for a successful transition.
     */
    run(): Promise<any>;
    isActive: () => boolean;
    /**
     * Checks if the Transition is valid
     *
     * @returns true if the Transition is valid
     */
    valid(): boolean;
    /**
     * The reason the Transition is invalid
     *
     * @returns an error message explaining why the transition is invalid
     */
    error(): string;
    /**
     * A string representation of the Transition
     *
     * @returns A string representation of the Transition
     */
    toString(): string;
}
