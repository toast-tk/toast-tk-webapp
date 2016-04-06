/** @module ng1 */ /** */
import { State } from "../state/stateObject";
import { ViewConfig } from "../view/interface";
import { Ng1ViewDeclaration } from "./interface";
import { Node } from "../path/node";
import { ResolveContext } from "../resolve/resolveContext";
export declare const ng1ViewConfigFactory: (node: any, view: any) => Ng1ViewConfig;
/**
 * This is a [[StateBuilder.builder]] function for angular1 `views`.
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to angular-ui-router (ng1).
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object
 * and applies the state-level configuration to a view named `$default`.
 */
export declare function ng1ViewsBuilder(state: State): {};
export declare class Ng1ViewConfig implements ViewConfig {
    node: Node;
    viewDecl: Ng1ViewDeclaration;
    loaded: boolean;
    controller: Function;
    template: string;
    locals: any;
    constructor(node: Node, viewDecl: Ng1ViewDeclaration);
    load(): any;
    /**
     * Checks a view configuration to ensure that it specifies a template.
     *
     * @return {boolean} Returns `true` if the configuration contains a valid template, otherwise `false`.
     */
    hasTemplate(): boolean;
    getTemplate(params: any, $factory: any, injector: ResolveContext): any;
    /**
     * Gets the controller for a view configuration.
     *
     * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
     */
    getController(injector: ResolveContext): Promise<any> | Function | string;
}
