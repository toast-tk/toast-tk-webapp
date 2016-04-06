declare let services: CoreServices;
export interface CoreServices {
    $q: any;
    $injector: any;
    /** Services related to getting or setting the browser location (url) */
    location: LocationServices;
    /** Retrieves configuration for how to construct a URL. */
    locationConfig: LocationConfig;
    template: TemplateServices;
}
export interface LocationServices {
    replace(): void;
    url(newurl: string): string;
    url(): string;
    path(): string;
    search(): string;
    hash(): string;
    onChange(callback: Function): Function;
}
export interface LocationConfig {
    port(): number;
    protocol(): string;
    host(): string;
    baseHref(): string;
    html5Mode(): boolean;
    hashPrefix(): string;
    hashPrefix(newprefix: string): string;
}
export interface TemplateServices {
    get(url: string): string;
}
export { services };
