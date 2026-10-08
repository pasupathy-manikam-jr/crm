import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <span className="flex size-7 items-center justify-center rounded-sm bg-linear-to-br from-chart-3 to-primary text-primary-foreground shadow-sm shadow-primary/30">
                <AppLogoIcon className="size-4.5 fill-current" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{name}</span>
        </>
    );
}
