/** @module resolve */ /** for typedoc */
import { Resolvable } from "./resolvable";
export interface Resolvables {
    [key: string]: Resolvable;
}
export interface IOptions1 {
    omitOwnLocals?: string[];
    resolvePolicy?: string;
}
export declare enum ResolvePolicy {
    JIT = 0,
    LAZY = 1,
    EAGER = 2,
}
