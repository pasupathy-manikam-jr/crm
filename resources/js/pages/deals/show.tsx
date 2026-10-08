import { Head, Link, router, setLayoutProps, usePage } from '@inertiajs/react';
import {
    PencilSimpleIcon,
    TrashIcon,
    ReceiptIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import DealController from '@/actions/App/Http/Controllers/DealController';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { RecordTabs } from '@/components/crm/record-tabs';
import type { DealOptions } from '@/components/crm/deal-form-dialog';
import { DealFormDialog } from '@/components/crm/deal-form-dialog';
import {
    customDetailItems,
    useCustomFields,
} from '@/components/crm/custom-fields';
import { DetailList } from '@/components/crm/detail-list';
import { SendEmailButton } from '@/components/crm/send-email-button';
import { StageBadge } from '@/components/crm/stage-badge';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import { show as showAccount } from '@/routes/accounts';
import { show as showContact } from '@/routes/contacts';
import { index, show } from '@/routes/deals';
import { create as createQuote } from '@/routes/quotes';
import type { Deal, RecordTabData, Stage } from '@/types';
import { t } from '@/lib/i18n';

type Props = RecordTabData &
    DealOptions & {
        deal: Deal & { stage: Stage };
    };

export default function ShowDeal({
    deal,
    activities,
    activityTypes,
    notes,
    attachments,
    history,
    ...options
}: Props) {
    const customFields = useCustomFields('deal');
    const { currency } = usePage().props;
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Deals', href: index() },
            { title: deal.name, href: show(deal.id) },
        ],
    });

    const moveTo = (stage: Stage) =>
        router.patch(
            DealController.moveStage.url(deal.id),
            { stage_id: stage.id },
            { preserveScroll: true },
        );
    const current = options.stages.findIndex((s) => s.id === deal.stage_id);
    const weighted = (Number(deal.amount) * deal.probability) / 100;

    return (
        <>
            <Head title={deal.name} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <PageHeader title={deal.name} description={deal.account?.name}>
                    <Button variant="outline" asChild>
                        <Link href={createQuote({ query: { deal: deal.id } })}>
                            <ReceiptIcon data-icon="inline-start" />
                            {t('Create quote')}
                        </Link>
                    </Button>
                    <SendEmailButton
                        record={{ type: 'deal', id: deal.id }}
                        to={deal.contact?.email}
                    />
                    <Button variant="outline" onClick={() => setEditing(true)}>
                        <PencilSimpleIcon data-icon="inline-start" />
                        {t('Edit')}
                    </Button>
                    <Button variant="outline" onClick={() => setDeleting(true)}>
                        <TrashIcon data-icon="inline-start" />
                        {t('Delete')}
                    </Button>
                </PageHeader>

                <RecordTabs
                    record={{ type: 'deal', id: deal.id }}
                    owners={options.owners}
                    data={{
                        activities,
                        activityTypes,
                        notes,
                        attachments,
                        history,
                    }}
                    overview={
                        <>
                            <section className="flex flex-wrap items-end gap-x-10 gap-y-4 border bg-card p-5 shadow-sm shadow-primary/5">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Amount')}
                                    </span>
                                    <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                                        {formatMoney(deal.amount, currency)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Weighted (:probability%)', {
                                            probability: deal.probability,
                                        })}
                                    </span>
                                    <span className="font-mono text-lg tabular-nums">
                                        {formatMoney(weighted, currency)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        {t('Stage')}
                                    </span>
                                    <StageBadge stage={deal.stage} />
                                </div>
                            </section>

                            <nav
                                aria-label={t('Move to stage')}
                                className="flex flex-col gap-2"
                            >
                                <span className="text-xs text-muted-foreground">
                                    {t('Move to stage')}
                                </span>
                                <ol className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
                                    {options.stages.map((stage, i) => {
                                        const isCurrent =
                                            stage.id === deal.stage_id;
                                        const passed =
                                            stage.kind === 'open' &&
                                            deal.stage.kind === 'open' &&
                                            i < current;

                                        return (
                                            <li key={stage.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        !isCurrent &&
                                                        moveTo(stage)
                                                    }
                                                    aria-current={
                                                        isCurrent
                                                            ? 'step'
                                                            : undefined
                                                    }
                                                    className={cn(
                                                        'flex w-full flex-col gap-0.5 border-t-2 bg-card px-3 py-2 text-left text-xs transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                                        isCurrent &&
                                                            stage.kind ===
                                                                'won' &&
                                                            'border-t-success bg-success/10',
                                                        isCurrent &&
                                                            stage.kind ===
                                                                'lost' &&
                                                            'border-t-destructive bg-destructive/10',
                                                        isCurrent &&
                                                            stage.kind ===
                                                                'open' &&
                                                            'border-t-primary bg-accent',
                                                        !isCurrent &&
                                                            (passed
                                                                ? 'border-t-primary/50'
                                                                : 'border-t-border'),
                                                    )}
                                                >
                                                    <span className="font-medium">
                                                        {stage.name}
                                                    </span>
                                                    <span className="font-mono text-muted-foreground">
                                                        {stage.probability}%
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </nav>

                            <Separator />

                            <DetailList
                                items={[
                                    {
                                        label: t('Account'),
                                        value: deal.account && (
                                            <Link
                                                href={showAccount(
                                                    deal.account.id,
                                                )}
                                                className="hover:underline"
                                            >
                                                {deal.account.name}
                                            </Link>
                                        ),
                                    },
                                    {
                                        label: t('Contact'),
                                        value: deal.contact && (
                                            <Link
                                                href={showContact(
                                                    deal.contact.id,
                                                )}
                                                className="hover:underline"
                                            >
                                                {deal.contact.first_name}{' '}
                                                {deal.contact.last_name}
                                            </Link>
                                        ),
                                    },
                                    {
                                        label: t('Expected close'),
                                        value:
                                            deal.expected_close_date &&
                                            formatDate(
                                                deal.expected_close_date,
                                            ),
                                    },
                                    {
                                        label: t('Closed'),
                                        value:
                                            deal.closed_at &&
                                            formatDate(deal.closed_at),
                                    },
                                    {
                                        label: t('Owner'),
                                        value: deal.owner.name,
                                    },
                                    {
                                        label: t('Added'),
                                        value: formatDate(deal.created_at),
                                    },
                                    ...customDetailItems(
                                        customFields,
                                        deal.custom_fields,
                                    ),
                                ]}
                            />
                        </>
                    }
                />
            </div>

            <DealFormDialog
                key={editing ? deal.id : 'closed'}
                deal={editing ? deal : null}
                options={options}
                onClose={() => setEditing(false)}
            />
            <ConfirmDeleteDialog
                form={deleting ? DealController.destroy.form(deal.id) : null}
                title={t('Delete :name?', { name: deal.name })}
                description={t('The deal will be removed from the pipeline.')}
                onClose={() => setDeleting(false)}
            />
        </>
    );
}
