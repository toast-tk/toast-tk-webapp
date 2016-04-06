/** @module transition */ /** for typedoc */
import { TransitionHookOptions } from "./interface";
import { IInjectable } from "../common/common";
import { ResolveContext } from "../resolve/module";
export declare class TransitionHook {
    private fn;
    private locals;
    private resolveContext;
    private options;
    constructor(fn: IInjectable, locals: any, resolveContext: ResolveContext, options: TransitionHookOptions);
    private isSuperseded;
    /**
     * Handles transition abort and transition redirect. Also adds any returned resolvables
     * to the pathContext for the current pathElement.  If the transition is rejected, then a rejected
     * promise is returned here, otherwise undefined is returned.
     */
    mapHookResult: Function;
    invokeStep: (moreLocals: any) => any;
    handleHookResult(hookResult: any): any;
    toString(): string;
    /**
     * Given an array of TransitionHooks, runs each one synchronously and sequentially.
     *
     * Returns a promise chain composed of any promises returned from each hook.invokeStep() call
     */
    static runSynchronousHooks(hooks: TransitionHook[], locals?: {}, swallowExceptions?: boolean): Promise<any>;
    static isRejection(hookResult: any): any;
}
