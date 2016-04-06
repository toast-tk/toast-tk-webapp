/** @module state */ /** for typedoc */
import { Transition } from "../../transition/transition";
export declare class EnterExitHooks {
    private transition;
    constructor(transition: Transition);
    registerHooks(): void;
    registerOnEnterHooks(): void;
    registerOnRetainHooks(): void;
    registerOnExitHooks(): void;
}
