import type { Auth } from '@/types/auth';
import type { CustomFieldDef } from '@/types/crm';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            /** en, ms or zh_CN. */
            locale: string;
            /** Every supported locale with its own name, for language pickers. */
            locales: Record<string, string>;
            /** lang/<locale>.json: English text → translation (empty for English). */
            translations: Record<string, string>;
            /** ISO 4217 code every amount is recorded in (config app.currency). */
            currency: string;
            /** The user's saved list filters. */
            savedViews: {
                id: number;
                list: string;
                name: string;
                query: Record<string, string>;
            }[];
            /** Active custom fields by record type. */
            customFields: Partial<
                Record<CustomFieldDef['entity'], CustomFieldDef[]>
            >;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
