import { State, StateMatcher } from "./module";
import { UrlMatcherFactory } from "../url/urlMatcherFactory";
export declare type BuilderFunction = (state: State, parent?) => any;
/**
 * @internalapi A internal global service
 *
 * StateBuilder is a factory for the internal [[State]] objects.
 *
 * When you register a state with the [[StateRegistry]], you register a plain old javascript object which
 * conforms to the [[StateDeclaration]] interface.  This factory takes that object and builds the corresponding
 * [[State]] object, which has an API and is used internally.
 *
 * Custom properties or API may be added to the internal [[State]] object by registering a decorator function
 * using the [[builder]] method.
 */
export declare class StateBuilder {
    private matcher;
    /** An object that contains all the BuilderFunctions registered, key'd by the name of the State property they build */
    private builders;
    constructor(matcher: StateMatcher, $urlMatcherFactoryProvider: UrlMatcherFactory);
    /**
     * Registers a [[BuilderFunction]] for a specific [[State]] property (e.g., `parent`, `url`, or `path`).
     * More than one BuilderFunction can be registered for a given property.
     *
     * The BuilderFunction(s) will be used to define the property on any subsequently built [[State]] objects.
     *
     * @param name The name of the State property being registered for.
     * @param fn The BuilderFunction which will be used to build the State property
     * @returns a function which deregisters the BuilderFunction
     */
    builder(name: string, fn: BuilderFunction): ((state: State, parent?: any) => any)[] | ((state: State, parent?: any) => any);
    /**
     * Builds all of the properties on an essentially blank State object, returning a State object which has all its
     * properties and API built.
     *
     * @param state an uninitialized State object
     * @returns the built State object
     */
    build(state: State): State;
    parentName(state: any): any;
    name(state: any): any;
}
