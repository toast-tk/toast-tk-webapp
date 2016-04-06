import { State } from "../state/module";
import { RawParams } from "../params/interface";
import { Param } from "../params/module";
import { ResolveContext, ResolveInjector } from "../resolve/module";
import { ViewConfig } from "../view/interface";
import { Resolvables } from "../resolve/interface";
export declare class Node {
    state: State;
    paramSchema: Param[];
    paramValues: {
        [key: string]: any;
    };
    resolves: Resolvables;
    views: ViewConfig[];
    resolveContext: ResolveContext;
    resolveInjector: ResolveInjector;
    constructor(state: Node);
    constructor(state: State);
    applyRawParams(params: RawParams): Node;
    parameter(name: string): Param;
    equals(node: Node, keys?: any[]): boolean;
    static clone(node: Node): Node;
    /**
     * Returns a new path which is a subpath of the first path. The new path starts from root and contains any nodes
     * that match the nodes in the second path. Nodes are compared using their state property.
     * @param first {Node[]}
     * @param second {Node[]}
     * @returns {Node[]}
     */
    static matching(first: Node[], second: Node[]): Node[];
}
