import { Transition } from "../../transition/transition";
import { ViewService } from "../../view/view";
export declare class ViewHooks {
    private treeChanges;
    private enteringViews;
    private exitingViews;
    private transition;
    private $view;
    constructor(transition: Transition, $view: ViewService);
    loadAllEnteringViews(): any;
    updateViews(): void;
    registerHooks(): void;
}
