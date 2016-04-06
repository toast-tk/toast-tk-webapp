/** @module resolve */ /** for typedoc */
import { IInjectable } from "../common/common";
import { Resolvables, IOptions1 } from "./interface";
import { Node } from "../path/module";
import { Resolvable } from "./resolvable";
import { State } from "../state/module";
export declare class ResolveContext {
    private _path;
    private _nodeFor;
    private _pathTo;
    constructor(_path: Node[]);
    /**
     * Gets the available Resolvables for the last element of this path.
     *
     * @param state the State (within the ResolveContext's Path) for which to get resolvables
     * @param options
     *
     * options.omitOwnLocals: array of property names
     *   Omits those Resolvables which are found on the last element of the path.
     *
     *   This will hide a deepest-level resolvable (by name), potentially exposing a parent resolvable of
     *   the same name further up the state tree.
     *
     *   This is used by Resolvable.resolve() in order to provide the Resolvable access to all the other
     *   Resolvables at its own PathElement level, yet disallow that Resolvable access to its own injectable Resolvable.
     *
     *   This is also used to allow a state to override a parent state's resolve while also injecting
     *   that parent state's resolve:
     *
     *   state({ name: 'G', resolve: { _G: function() { return "G"; } } });
     *   state({ name: 'G.G2', resolve: { _G: function(_G) { return _G + "G2"; } } });
     *   where injecting _G into a controller will yield "GG2"
     */
    getResolvables(state?: State, options?: any): Resolvables;
    /** Inspects a function `fn` for its dependencies.  Returns an object containing any matching Resolvables */
    getResolvablesForFn(fn: IInjectable): {
        [key: string]: Resolvable;
    };
    isolateRootTo(state: State): ResolveContext;
    addResolvables(resolvables: Resolvables, state: State): void;
    /** Gets the resolvables declared on a particular state */
    getOwnResolvables(state: State): Resolvables;
    resolvePath(options?: IOptions1): Promise<any>;
    resolvePathElement(state: State, options?: IOptions1): Promise<any>;
    /**
     * Injects a function given the Resolvables available in the path, from the first node
     * up to the node for the given state.
     *
     * First it resolves all the resolvable depencies.  When they are done resolving, it invokes
     * the function.
     *
     * @return a promise for the return value of the function.
     *
     * @param fn: the function to inject (i.e., onEnter, onExit, controller)
     * @param locals: are the angular $injector-style locals to inject
     * @param options: options (TODO: document)
     */
    invokeLater(fn: IInjectable, locals?: any, options?: IOptions1): Promise<any>;
    /**
     * Immediately injects a function with the dependent Resolvables available in the path, from
     * the first node up to the node for the given state.
     *
     * If a Resolvable is not yet resolved, then null is injected in place of the resolvable.
     *
     * @return the return value of the function.
     *
     * @param fn: the function to inject (i.e., onEnter, onExit, controller)
     * @param locals: are the angular $injector-style locals to inject
     * @param options: options (TODO: document)
     */
    invokeNow(fn: IInjectable, locals: any, options?: any): any;
}
