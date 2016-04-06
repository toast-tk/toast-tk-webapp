/** @module state */ /** for typedoc */
export declare class Glob {
    text: string;
    glob: Array<string>;
    constructor(text: string);
    matches(name: string): boolean;
    static is(text: string): boolean;
    static fromString(text: string): Glob;
}
