/** @module core */ /** */
import { StateParams } from "./params/stateParams";
import { StateDeclaration } from "./state/interface";
import { State } from "./state/stateObject";
import { Transition } from "./transition/transition";
import { Queue } from "./common/queue";
import { TransitionService } from "./transition/transitionService";
/**
 * Global mutable state
 *
 * This is where we hold the global mutable state such as current state, current
 * params, current transition, last successful transition, last attempted transition, etc.
 */
export declare class UIRouterGlobals {
    /**
     * Current parameter values
     *
     * The parameter values from the latest successful transition
     */
    params: StateParams;
    /**
     * Current state
     *
     * The to-state from the latest successful transition
     */
    current: StateDeclaration;
    /**
     * Current state
     *
     * The to-state from the latest successful transition
     */
    $current: State;
    /**
     * The current transition (in progress)
     */
    transition: Transition;
    /**
     * The transition history
     *
     * This queue's size is limited to a maximum number (default: 1)
     */
    transitionHistory: Queue<Transition>;
    /**
     * The history of successful transitions
     *
     * This queue's size is limited to a maximum number (default: 1)
     */
    successfulTransitions: Queue<Transition>;
    constructor(transitionService: TransitionService);
}
