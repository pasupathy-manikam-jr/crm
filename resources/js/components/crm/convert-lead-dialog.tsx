import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import ConvertLeadController from '@/actions/App/Http/Controllers/ConvertLeadController';
import { RecordFormDialog } from '@/components/crm/record-form-dialog';
import { SelectField, TextField } from '@/components/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Lead, Option } from '@/types';
import { t } from '@/lib/i18n';

/**
 * Converts a lead into an account (new or existing), a contact and, if ticked, a
 * deal. The server does it in one transaction.
 */
export function ConvertLeadDialog({
    lead,
    open,
    accounts,
    stages,
    onClose,
}: {
    lead: Lead;
    open: boolean;
    accounts: Option[];
    stages: { id: number; name: string }[];
    onClose: () => void;
}) {
    const { currency } = usePage().props;
    const [accountMode, setAccountMode] = useState<'new' | 'existing'>('new');
    const [createDeal, setCreateDeal] = useState(true);

    return (
        <RecordFormDialog
            open={open}
            title={t('Convert :name', { name: lead.full_name })}
            description={t(
                'Creates a contact for :name, links it to an account and, if you like, opens a deal. The lead is then marked converted.',
                { name: lead.first_name },
            )}
            form={ConvertLeadController.form(lead.id)}
            formKey={lead.id}
            submitLabel={t('Convert lead')}
            twoColumns
            onClose={onClose}
        >
            {(errors) => (
                <>
                    <FieldSet className="sm:col-span-2">
                        <FieldLegend variant="label">
                            {t('Account')}
                        </FieldLegend>
                        <RadioGroup
                            name="account_mode"
                            value={accountMode}
                            onValueChange={(v) =>
                                setAccountMode(v as 'new' | 'existing')
                            }
                            className="flex gap-6"
                        >
                            <Field orientation="horizontal">
                                <RadioGroupItem value="new" id="convert-new" />
                                <FieldLabel
                                    htmlFor="convert-new"
                                    className="font-normal"
                                >
                                    {t('New account')}
                                </FieldLabel>
                            </Field>
                            <Field orientation="horizontal">
                                <RadioGroupItem
                                    value="existing"
                                    id="convert-existing"
                                    disabled={accounts.length === 0}
                                />
                                <FieldLabel
                                    htmlFor="convert-existing"
                                    className="font-normal"
                                >
                                    {t('Existing account')}
                                </FieldLabel>
                            </Field>
                        </RadioGroup>
                    </FieldSet>

                    {accountMode === 'new' ? (
                        <TextField
                            id="convert-account-name"
                            label={t('Account name')}
                            name="account_name"
                            defaultValue={lead.company ?? ''}
                            error={errors.account_name}
                            className="sm:col-span-2"
                        />
                    ) : (
                        <SelectField
                            id="convert-account"
                            label={t('Account')}
                            name="account_id"
                            options={accounts}
                            placeholder={t('Choose an account')}
                            error={errors.account_id}
                            className="sm:col-span-2"
                        />
                    )}

                    <Field orientation="horizontal" className="sm:col-span-2">
                        <Checkbox
                            id="convert-create-deal"
                            name="create_deal"
                            checked={createDeal}
                            onCheckedChange={(v) => setCreateDeal(v === true)}
                        />
                        <FieldLabel
                            htmlFor="convert-create-deal"
                            className="font-normal"
                        >
                            {t('Create a deal')}
                        </FieldLabel>
                    </Field>

                    {createDeal && (
                        <>
                            <TextField
                                id="convert-deal-name"
                                label={t('Deal name')}
                                name="deal_name"
                                defaultValue={lead.company ?? lead.full_name}
                                error={errors.deal_name}
                                className="sm:col-span-2"
                            />
                            <TextField
                                id="convert-deal-amount"
                                label={t('Amount (:currency)', { currency })}
                                name="deal_amount"
                                inputMode="decimal"
                                error={errors.deal_amount}
                            />
                            <SelectField
                                id="convert-stage"
                                label={t('Stage')}
                                name="stage_id"
                                options={stages.map((s) => ({
                                    value: String(s.id),
                                    label: s.name,
                                }))}
                                defaultValue={String(stages[0]?.id ?? '')}
                                error={errors.stage_id}
                            />
                        </>
                    )}
                </>
            )}
        </RecordFormDialog>
    );
}
