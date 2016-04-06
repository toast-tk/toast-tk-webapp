import { TreeChanges } from "../transition/interface";
import { State, TargetState } from "../state/module";
import { Node } from "../path/node";
import { Transition } from "../transition/module";
import { ViewService } from "../view/view";
/**
 * This class contains functions which convert TargetStates, Nodes and paths from one type to another.
 */
export declare class PathFactory {
    constructor();
    /** Given a Node[], create an TargetState */
    static makeTargetState(path: Node[]): TargetState;
    static buildPath(targetState: TargetState): Node[];
    /** Given a fromPath: Node[] and a TargetState, builds a toPath: Node[] */
    static buildToPath(fromPath: Node[], targetState: TargetState): Node[];
    static applyViewConfigs($view: ViewService, path: Node[]): any[];
    /**
     * Given a fromPath and a toPath, returns a new to path which inherits parameters from the fromPath
     *
     * For a parameter in a node to be inherited from the from path:
     * - The toPath's node must have a matching node in the fromPath (by state).
     * - The parameter name must not be found in the toKeys parameter array.
     *
     * Note: the keys provided in toKeys are intended to be those param keys explicitly specified by some
     * caller, for instance, $state.transitionTo(..., toParams).  If a key was found in toParams,
     * it is not inherited from the fromPath.
     */
    static inheritParams(fromPath: Node[], toPath: Node[], toKeys?: string[]): Node[];
    /**
     * Given a path, upgrades the path to a Node[].  Each node is assigned a ResolveContext
     * and ParamValues object which is bound to the whole path, but closes over the subpath from root to the node.
     * The views are also added to the node.
     */
    static bindTransNodesToPath(resolvePath: Node[]): Node[];
    /**
     * Computes the tree changes (entering, exiting) between a fromPath and toPath.
     */
    static treeChanges(fromPath: Node[], toPath: Node[], reloadState: State): TreeChanges;
    static bindTransitionResolve(treeChanges: TreeChanges, transition: Transition): void;
    /**
     * Find a subpath of a path that stops at the node for a given state
     *
     * Given an array of nodes, returns a subset of the array starting from the first node, up to the
     * node whose state matches `stateName`
     *
     * @param path a path of [[Node]]s
     * @param state the [[State]] to stop at
     */
    static subPath(path: Node[], state: any): Node[];
    /** Gets the raw parameter values from a path */
    static paramValues: (path: Node[]) => {};
}
