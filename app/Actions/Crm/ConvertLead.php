<?php

namespace App\Actions\Crm;

use App\Enums\LeadStatus;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Turns a lead into an account (new or existing), a contact and optionally a deal,
 * all owned by the lead's owner. Everything happens in one transaction, so a failure
 * leaves no half-converted lead behind.
 */
class ConvertLead
{
    /**
     * @param  array<string, mixed>  $input  ConvertLeadRequest::validated()
     */
    public function __invoke(Lead $lead, array $input): Lead
    {
        return DB::transaction(function () use ($lead, $input): Lead {
            // Re-read with a row lock so two clicks can't convert the same lead twice.
            $lead = Lead::whereKey($lead->id)->lockForUpdate()->firstOrFail();

            if ($lead->isConverted()) {
                throw new LogicException(__('This lead was already converted.'));
            }

            $account = $input['account_mode'] === 'existing'
                ? Account::findOrFail((int) $input['account_id'])
                : Account::create([
                    'name' => (string) $input['account_name'],
                    'phone' => $lead->phone,
                    'owner_id' => $lead->owner_id,
                ]);

            $contact = Contact::create([
                'first_name' => $lead->first_name,
                'last_name' => $lead->last_name,
                'job_title' => $lead->job_title,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'account_id' => $account->id,
                'owner_id' => $lead->owner_id,
            ]);

            $deal = ($input['create_deal'] ?? false) === true
                ? Deal::create([
                    'name' => (string) $input['deal_name'],
                    'amount' => $input['deal_amount'],
                    'stage_id' => (int) $input['stage_id'],
                    'account_id' => $account->id,
                    'contact_id' => $contact->id,
                    'owner_id' => $lead->owner_id,
                ])
                : null;

            $lead->forceFill([
                'status' => LeadStatus::Converted,
                'converted_at' => now(),
                'converted_account_id' => $account->id,
                'converted_contact_id' => $contact->id,
                'converted_deal_id' => $deal?->id,
            ])->save();

            return $lead;
        });
    }
}
