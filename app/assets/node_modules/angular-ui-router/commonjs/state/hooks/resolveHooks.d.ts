import { Transition } from "../../transition/transition";
/**
 * Registers Eager and Lazy (for entering states) resolve hooks
 *
 * * registers a hook that resolves EAGER resolves, for the To Path, onStart of the transition
 * * registers a hook that resolves LAZY resolves, for each state, before it is entered
 */
export declare class ResolveHooks {
    private transition;
    constructor(transition: Transition);
    registerHooks(): void;
}
