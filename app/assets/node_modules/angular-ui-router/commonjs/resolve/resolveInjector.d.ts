import { ResolveContext } from "./resolveContext";
import { State } from "../state/module";
export declare class ResolveInjector {
    private _resolveContext;
    private _state;
    constructor(_resolveContext: ResolveContext, _state: State);
    /** Returns a promise to invoke an annotated function in the resolve context */
    invokeLater(injectedFn: any, locals: any): Promise<any>;
    /** Invokes an annotated function in the resolve context */
    invokeNow(injectedFn: any, locals: any): any;
    /** Returns the a promise for locals (realized Resolvables) that a function wants */
    getLocals(injectedFn: any): {
        [key: string]: Promise<any>;
    };
}
