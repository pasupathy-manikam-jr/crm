<?php

namespace App\Support;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\SupportCase;
use Illuminate\Database\Eloquent\Model;

/**
 * The record types activities, notes and files can belong to, by the short alias
 * stored in their *_type columns (registered as the morph map).
 */
final class CrmRecords
{
    /**
     * @var array<string, class-string<Model>>
     */
    public const TYPES = [
        'account' => Account::class,
        'contact' => Contact::class,
        'lead' => Lead::class,
        'deal' => Deal::class,
        'case' => SupportCase::class,
        'contract' => Contract::class,
    ];
}
