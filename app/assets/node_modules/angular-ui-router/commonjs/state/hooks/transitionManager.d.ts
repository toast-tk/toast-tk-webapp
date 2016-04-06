import { Transition } from "../../transition/transition";
import { StateDeclaration } from "../interface";
import { StateService } from "../stateService";
import { UrlRouter } from "../../url/urlRouter";
import { UIRouterGlobals } from "../../globals";
/**
 * This class:
 *
 * * Takes a blank transition object and adds all the hooks necessary for it to behave like a state transition.
 *
 * * Runs the transition, returning a chained promise which:
 *   * transforms the resolved Transition.promise to the final destination state.
 *   * manages the rejected Transition.promise, checking for Dynamic or Redirected transitions
 *
 * * Registers a handler to update global $state data such as "active transitions" and "current state/params"
 *
 * * Registers view hooks, which maintain the list of active view configs and sync with/update the ui-views
 *
 * * Registers onEnter/onRetain/onExit hooks which delegate to the state's hooks of the same name, at the appropriate time
 *
 * * Registers eager and lazy resolve hooks
 */
export declare class TransitionManager {
    private transition;
    private $transitions;
    private $urlRouter;
    private $view;
    private $state;
    private globals;
    private treeChanges;
    private enterExitHooks;
    private viewHooks;
    private resolveHooks;
    private $q;
    constructor(transition: Transition, $transitions: any, $urlRouter: UrlRouter, $view: any, $state: StateService, globals: UIRouterGlobals);
    runTransition(): Promise<any>;
    registerUpdateGlobalState(): void;
    transRejected(error: any): (StateDeclaration | Promise<any>);
    updateUrl(): void;
    private _redirectMgr(redirect);
}
