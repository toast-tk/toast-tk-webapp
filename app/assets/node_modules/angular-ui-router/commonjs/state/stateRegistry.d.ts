/** @module state */ /** for typedoc */
import { State } from "./stateObject";
import { StateMatcher } from "./stateMatcher";
import { StateQueueManager } from "./stateQueueManager";
import { UrlMatcherFactory } from "../url/urlMatcherFactory";
import { StateDeclaration } from "./interface";
import { BuilderFunction } from "./stateBuilder";
import { StateOrName } from "./interface";
export declare class StateRegistry {
    private _root;
    private states;
    matcher: StateMatcher;
    private builder;
    stateQueue: StateQueueManager;
    constructor(urlMatcherFactory: UrlMatcherFactory, urlRouterProvider: any);
    root(): State;
    register(stateDefinition: StateDeclaration): any;
    get(): StateDeclaration[];
    get(stateOrName: StateOrName, base: StateOrName): StateDeclaration;
    decorator(name: string, func: BuilderFunction): ((state: State, parent?: any) => any)[] | ((state: State, parent?: any) => any);
}
