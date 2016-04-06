import { Transition } from "../transition/transition";
import { ActiveUIView, ViewConfig } from "../view/interface";
/**
 * Trace categories
 *
 * [[Trace.enable]] or [[Trace.disable]] a category
 *
 * `trace.enable(Category.TRANSITION)`
 *
 * These can also be provided using a matching string, or position ordinal
 *
 * `trace.enable("TRANSITION")`
 *
 * `trace.enable(1)`
 */
export declare enum Category {
    RESOLVE = 0,
    TRANSITION = 1,
    HOOK = 2,
    INVOKE = 3,
    UIVIEW = 4,
    VIEWCONFIG = 5,
}
/**
 * Prints UI-Router Transition trace information to the console.
 */
export declare class Trace {
    approximateDigests: number;
    constructor();
    /** @hidden */
    private _enabled;
    /** @hidden */
    private _set(enabled, categories);
    /**
     * Enables a trace [[Category]]
     *
     * ```
     * trace.enable("TRANSITION");
     * ```
     *
     * @param categories categories to enable. If `categories` is omitted, all categories are enabled.
     *        Also takes strings (category name) or ordinal (category position)
     */
    enable(...categories: Category[]): void;
    /**
     * Disables a trace [[Category]]
     *
     * ```
     * trace.disable("VIEWCONFIG");
     * ```
     *
     * @param categories categories to disable. If `categories` is omitted, all categories are disabled.
     *        Also takes strings (category name) or ordinal (category position)
     */
    disable(...categories: Category[]): void;
    /**
     * Retrieves the enabled stateus of a [[Category]]
     *
     * ```
     * trace.enabled("VIEWCONFIG"); // true or false
     * ```
     *
     * @returns boolean true if the category is enabled
     */
    enabled(category: Category): boolean;
    /** called by ui-router code */
    traceTransitionStart(transition: Transition): void;
    /** called by ui-router code */
    traceTransitionIgnored(transition: Transition): void;
    /** called by ui-router code */
    traceHookInvocation(step: any, options: any): void;
    /** called by ui-router code */
    traceHookResult(hookResult: any, transitionResult: any, transitionOptions: any): void;
    /** called by ui-router code */
    traceResolvePath(path: any, options: any): void;
    /** called by ui-router code */
    traceResolvePathElement(pathElement: any, resolvablePromises: any, options: any): void;
    /** called by ui-router code */
    traceResolveResolvable(resolvable: any, options: any): void;
    /** called by ui-router code */
    traceResolvableResolved(resolvable: any, options: any): void;
    /** called by ui-router code */
    tracePathElementInvoke(node: any, fn: any, deps: any, options: any): void;
    /** called by ui-router code */
    traceError(error: any, transition: Transition): void;
    /** called by ui-router code */
    traceSuccess(finalState: any, transition: Transition): void;
    /** called by ui-router code */
    traceUiViewEvent(event: string, viewData: ActiveUIView, extra?: string): void;
    /** called by ui-router code */
    traceUiViewConfigUpdated(viewData: ActiveUIView, context: any): void;
    /** called by ui-router code */
    traceUiViewScopeCreated(viewData: ActiveUIView, newScope: any): void;
    /** called by ui-router code */
    traceUiViewFill(viewData: ActiveUIView, html: any): void;
    /** called by ui-router code */
    traceViewServiceEvent(event: string, viewConfig: ViewConfig): void;
    /** called by ui-router code */
    traceViewServiceUiViewEvent(event: string, viewData: ActiveUIView): void;
}
/**
 * The [[Trace]] singleton
 *
 * @example
 * ```js
 *
 * import {trace} from "angular-ui-router";
 * trace.enable(1, 5);
 * ```
 */
declare let trace: Trace;
export { trace };
