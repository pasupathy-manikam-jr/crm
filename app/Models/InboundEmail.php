<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An email read from a mailbox, what it was matched to, and the quote-extraction outcome
 * with its AI usage.
 *
 * @property int $id
 * @property int $mailbox_id
 * @property string $message_id
 * @property string|null $in_reply_to
 * @property string|null $references
 * @property string $from_email
 * @property string|null $from_name
 * @property string|null $subject
 * @property string|null $body
 * @property CarbonInterface $received_at
 * @property string $status
 * @property int|null $contact_id
 * @property int|null $account_id
 * @property int|null $lead_id
 * @property int|null $support_case_id
 * @property int|null $quote_id
 * @property string|null $ai_status
 * @property string|null $ai_confidence
 * @property int|null $ai_input_tokens
 * @property int|null $ai_output_tokens
 * @property string|null $ai_cost
 * @property string|null $ai_error
 */
#[Fillable(['mailbox_id', 'message_id', 'in_reply_to', 'references', 'from_email', 'from_name', 'subject', 'body', 'received_at', 'status', 'contact_id', 'account_id', 'lead_id', 'support_case_id', 'quote_id', 'ai_status', 'ai_confidence', 'ai_input_tokens', 'ai_output_tokens', 'ai_cost', 'ai_error'])]
class InboundEmail extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['received_at' => 'datetime', 'ai_cost' => 'decimal:6', 'ai_confidence' => 'decimal:3'];
    }

    /**
     * @return BelongsTo<Mailbox, $this>
     */
    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }

    /**
     * @return BelongsTo<Contact, $this>
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * @return BelongsTo<Lead, $this>
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * @return BelongsTo<SupportCase, $this>
     */
    public function supportCase(): BelongsTo
    {
        return $this->belongsTo(SupportCase::class);
    }

    /**
     * @return BelongsTo<Quote, $this>
     */
    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }
}
