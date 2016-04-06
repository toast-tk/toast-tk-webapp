import { Resolvables, IOptions1 } from "./interface";
import { ResolveContext } from "./resolveContext";
/**
 * The basic building block for the resolve system.
 *
 * Resolvables encapsulate a state's resolve's resolveFn, the resolveFn's declared dependencies, the wrapped (.promise),
 * and the unwrapped-when-complete (.data) result of the resolveFn.
 *
 * Resolvable.get() either retrieves the Resolvable's existing promise, or else invokes resolve() (which invokes the
 * resolveFn) and returns the resulting promise.
 *
 * Resolvable.get() and Resolvable.resolve() both execute within a context path, which is passed as the first
 * parameter to those fns.
 */
export declare class Resolvable {
    constructor(name: string, resolveFn: Function, preResolvedData?: any);
    name: string;
    resolveFn: Function;
    deps: string[];
    promise: Promise<any>;
    data: any;
    resolveResolvable(resolveContext: ResolveContext, options?: IOptions1): any;
    get(resolveContext: ResolveContext, options?: IOptions1): Promise<any>;
    toString(): string;
    /**
     * Validates the result map as a "resolve:" style object, then transforms the resolves into Resolvables
     */
    static makeResolvables(resolves: {
        [key: string]: Function;
    }): Resolvables;
}
