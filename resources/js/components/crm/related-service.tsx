import { Link, usePage } from '@inertiajs/react';
import { PlusIcon } from '@phosphor-icons/react';
import {
    CasePriorityBadge,
    CaseStatusBadge,
    SlaBadge,
} from '@/components/crm/case-badges';
import {
    ContractStatusBadge,
    EndsInBadge,
} from '@/components/crm/contract-badges';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatMoney } from '@/lib/utils';
import { index as cases, show as showCase } from '@/routes/cases';
import { index as contracts, show as showContract } from '@/routes/contracts';
import type { Contract, RecordDefaults, SupportCase } from '@/types';
import { t } from '@/lib/i18n';

/**
 * An account's or contact's cases and contracts, each with a button that opens the add
 * form on its list page with this account/contact filled in.
 */
export function RelatedService({
    supportCases,
    contractList,
    defaults,
}: {
    supportCases: SupportCase[];
    contractList: Contract[];
    defaults: RecordDefaults;
}) {
    const { currency } = usePage().props;
    const query = {
        new: 1,
        account: defaults.account_id ?? undefined,
        contact: defaults.contact_id ?? undefined,
    };

    return (
        <>
            <Separator />
            <section className="flex flex-col gap-4">
                <Heading
                    title={t('Cases')}
                    count={supportCases.length}
                    action={t('Open case')}
                    href={cases({ query })}
                />
                <DataTable
                    columns={[
                        {
                            key: 'case',
                            header: t('Case'),
                            cell: (c) => (
                                <Link
                                    href={showCase(c.id)}
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    <span className="font-mono">
                                        {c.number}
                                    </span>{' '}
                                    {c.subject}
                                </Link>
                            ),
                        },
                        {
                            key: 'priority',
                            header: t('Priority'),
                            cell: (c) => (
                                <CasePriorityBadge priority={c.priority} />
                            ),
                        },
                        {
                            key: 'status',
                            header: t('Status'),
                            cell: (c) => <CaseStatusBadge status={c.status} />,
                        },
                        {
                            key: 'sla',
                            header: t('SLA'),
                            cell: (c) => <SlaBadge supportCase={c} />,
                        },
                    ]}
                    rows={supportCases}
                    rowKey={(c) => c.id}
                    empty={t('No cases yet.')}
                />
            </section>

            <Separator />
            <section className="flex flex-col gap-4">
                <Heading
                    title={t('Contracts')}
                    count={contractList.length}
                    action={t('Add contract')}
                    href={contracts({ query })}
                />
                <DataTable
                    columns={[
                        {
                            key: 'name',
                            header: t('Contract'),
                            cell: (c) => (
                                <Link
                                    href={showContract(c.id)}
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    {c.name}
                                </Link>
                            ),
                        },
                        {
                            key: 'status',
                            header: t('Status'),
                            cell: (c) => (
                                <span className="flex flex-wrap gap-1.5">
                                    <ContractStatusBadge status={c.status} />
                                    <EndsInBadge contract={c} />
                                </span>
                            ),
                        },
                        {
                            key: 'end',
                            header: t('Ends'),
                            className: 'font-mono tabular-nums',
                            cell: (c) => formatDate(c.end_date),
                        },
                        {
                            key: 'value',
                            header: t('Value'),
                            className: 'text-right font-mono tabular-nums',
                            cell: (c) => formatMoney(c.value, currency),
                        },
                    ]}
                    rows={contractList}
                    rowKey={(c) => c.id}
                    empty={t('No contracts yet.')}
                />
            </section>
        </>
    );
}

function Heading({
    title,
    count,
    action,
    href,
}: {
    title: string;
    count: number;
    action: string;
    href: Parameters<typeof Link>[0]['href'];
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">
                {title} <span className="text-muted-foreground">{count}</span>
            </h2>
            <Button variant="outline" size="sm" asChild>
                <Link href={href}>
                    <PlusIcon data-icon="inline-start" />
                    {action}
                </Link>
            </Button>
        </div>
    );
}
