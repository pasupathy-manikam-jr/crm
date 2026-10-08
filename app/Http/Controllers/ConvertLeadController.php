<?php

namespace App\Http\Controllers;

use App\Actions\Crm\ConvertLead;
use App\Http\Requests\Crm\ConvertLeadRequest;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use LogicException;

class ConvertLeadController extends Controller
{
    /**
     * Convert the lead, then open the deal it produced (or its new account).
     */
    public function __invoke(ConvertLeadRequest $request, Lead $lead, ConvertLead $convert): RedirectResponse
    {
        try {
            $lead = $convert($lead, $request->validated());
        } catch (LogicException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name converted.', ['name' => $lead->full_name])]);

        return $lead->converted_deal_id !== null
            ? to_route('deals.show', $lead->converted_deal_id)
            : to_route('accounts.show', (int) $lead->converted_account_id);
    }
}
