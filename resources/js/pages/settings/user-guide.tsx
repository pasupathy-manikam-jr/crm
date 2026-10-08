import { Head, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { sections as en } from '@/components/user-guide/en';
import { sections as ms } from '@/components/user-guide/ms';
import { sections as zhCN } from '@/components/user-guide/zh_CN';
import { currentLocale, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { userGuide } from '@/routes';

const guides = { en, ms, zh_CN: zhCN };

export default function UserGuide() {
    const { auth } = usePage().props;
    const sections =
        guides[currentLocale() as keyof typeof guides] ?? guides.en;
    const shown = sections.filter(
        (s) =>
            !s.who ||
            (s.who === 'catalog' && auth.can.manageCatalog) ||
            (s.who === 'admin' && auth.can.manageUsers),
    );

    return (
        <>
            <Head title={t('User guide')} />
            <h1 className="sr-only">{t('User guide')}</h1>

            <div className="space-y-8">
                <Heading
                    variant="small"
                    title={t('User guide')}
                    description={t('How to use OricCRM, section by section.')}
                />

                <nav
                    aria-label={t('Guide contents')}
                    className="border bg-card p-4"
                >
                    <ol className="grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        {shown.map((s, i) => (
                            <li key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    {i + 1}. {s.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="grid gap-x-12 gap-y-8 xl:grid-cols-2">
                    {shown.map((s, i) => (
                        <section
                            key={s.id}
                            id={s.id}
                            className={cn(
                                'scroll-mt-20 space-y-3 border-t pt-6 text-sm leading-relaxed [&_ul]:space-y-1.5 [&_ul>li]:ml-5 [&_ul>li]:list-disc',
                                s.wide && 'xl:col-span-2',
                            )}
                        >
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                {i + 1}. {s.title}
                                {s.who === 'admin' && (
                                    <Badge variant="secondary">
                                        {t('Admins')}
                                    </Badge>
                                )}
                                {s.who === 'catalog' && (
                                    <Badge variant="secondary">
                                        {t('Admins & managers')}
                                    </Badge>
                                )}
                            </h2>
                            {s.body}
                        </section>
                    ))}
                </div>
            </div>
        </>
    );
}

UserGuide.layout = {
    breadcrumbs: [{ title: 'User guide', href: userGuide() }],
};
