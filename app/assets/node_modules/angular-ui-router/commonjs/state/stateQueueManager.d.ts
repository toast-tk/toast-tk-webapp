import { StateDeclaration } from "./interface";
import { State } from "./module";
import { StateBuilder } from "./stateBuilder";
export declare class StateQueueManager {
    states: {
        [key: string]: State;
    };
    builder: StateBuilder;
    $urlRouterProvider: any;
    queue: State[];
    private $state;
    constructor(states: {
        [key: string]: State;
    }, builder: StateBuilder, $urlRouterProvider: any);
    register(config: StateDeclaration): any;
    flush($state: any): {
        [key: string]: State;
    };
    autoFlush($state: any): void;
    attachRoute($state: any, state: any): void;
}
