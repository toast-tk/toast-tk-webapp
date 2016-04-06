/**
 * Annotates a controller expression (may be a controller function(), a "controllername",
 * or "controllername as name")
 *
 * - Temporarily decorates $injector.instantiate.
 * - Invokes $controller() service
 *   - Calls $injector.instantiate with controller constructor
 * - Annotate constructor
 * - Undecorate $injector
 *
 * returns an array of strings, which are the arguments of the controller expression
 */
export declare function annotateController(controllerExpression: any): string[];
export declare function watchDigests($rootScope: any): void;
