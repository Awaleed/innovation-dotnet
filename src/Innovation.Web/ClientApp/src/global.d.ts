import '@inertiajs/core';

/**
 * Global Inertia type configuration via declaration merging.
 * Shared props are available on every page via usePage().props.
 * Mirrors the HandleInertiaRequests middleware in Innovation.Web.
 */
declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            auth: {
                user: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
            };
        };
    }
}
