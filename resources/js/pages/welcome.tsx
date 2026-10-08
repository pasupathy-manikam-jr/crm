import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title={t('Welcome')} />
            <Button asChild size="lg" className="w-full">
                {auth.user ? (
                    <Link href={dashboard()}>{t('Go to dashboard')}</Link>
                ) : (
                    <Link href={login()}>{t('Log in')}</Link>
                )}
            </Button>
        </>
    );
}

Welcome.layout = {
    title: 'Welcome back',
    description: 'Sign in with the account your administrator created for you.',
};
