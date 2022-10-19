declare type MeetupProviderOptions = {
    url: string;
    fetch: any;
    entity: Record<string, any>;
    debug: boolean;
};
declare function MeetupProvider(this: any, options: MeetupProviderOptions): {
    exports: {
        makeUrl: (suffix: string, q: any) => string;
        makeConfig: (config?: any) => any;
        getJSON: (url: string, config?: any) => Promise<any>;
        postJSON: (url: string, config: any) => Promise<any>;
    };
};
export default MeetupProvider;
