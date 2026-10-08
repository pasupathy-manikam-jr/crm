<?php

namespace App\Jobs;

use App\Models\InboundEmail;
use App\Models\Product;
use App\Models\Quote;
use App\Support\Mail\QuoteExtractor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Turn a matched email into a draft quote when Claude reads it as a quote request
 * (confidence at least MIN_CONFIDENCE). Lines are matched to products by SKU, then by exact
 * name; anything unmatched is added at price 0 and listed in the quote's notes to check.
 * Nothing is sent: a person reviews and sends the draft. Usage and cost are logged.
 */
class ExtractQuoteFromEmail implements ShouldQueue
{
    use Queueable;

    public const MIN_CONFIDENCE = 0.5;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [60, 300];

    public function __construct(public InboundEmail $email) {}

    public function handle(QuoteExtractor $extractor): void
    {
        if (blank(config('services.anthropic.key'))) {
            $this->email->update(['ai_status' => 'skipped', 'ai_error' => 'No ANTHROPIC_API_KEY set.']);

            return;
        }

        $result = $extractor->extract($this->email);
        $data = $result['data'];
        $usage = [
            'ai_confidence' => min(1, max(0, (float) $data['confidence'])),
            'ai_input_tokens' => $result['input_tokens'],
            'ai_output_tokens' => $result['output_tokens'],
            'ai_cost' => $result['input_tokens'] / 1e6 * (float) config('services.anthropic.input_cost_per_mtok')
                + $result['output_tokens'] / 1e6 * (float) config('services.anthropic.output_cost_per_mtok'),
            'ai_error' => null,
        ];

        if (! $data['is_quote_request'] || $usage['ai_confidence'] < self::MIN_CONFIDENCE) {
            $this->email->update(['ai_status' => 'not_quote', ...$usage]);

            return;
        }

        DB::transaction(function () use ($data, $usage): void {
            [$lines, $unmatched] = $this->lines($data['items']);
            $contact = $this->email->contact()->withoutGlobalScope('visible')->first();

            $notes = array_filter([
                "Drafted from {$this->email->from_email}'s email “{$this->email->subject}” — check before sending.",
                $unmatched === [] ? null : 'Not matched to a product (priced at 0): '.implode('; ', $unmatched).'.',
                ! empty($data['requested_date']) ? "Requested date: {$data['requested_date']}." : null,
                $data['notes'] ?? null,
            ]);

            $quote = Quote::create([
                'account_id' => $this->email->account_id,
                'contact_id' => $this->email->contact_id,
                'owner_id' => $contact->owner_id ?? $this->email->mailbox->owner_id,
                'notes' => Str::limit(implode("\n", $notes), 5000, '…'),
            ]);
            $quote->syncItems($lines);

            $this->email->update(['ai_status' => 'drafted', 'quote_id' => $quote->id, ...$usage]);
        });
    }

    /**
     * @param  list<array{product_sku?: string|null, description: string, quantity: float|int, unit?: string|null}>  $items
     * @return array{0: list<array{product_id: int|null, description: string, quantity: string, unit_price: string, discount_percent: string, tax_rate: string}>, 1: list<string>}
     */
    private function lines(array $items): array
    {
        $lines = [];
        $unmatched = [];

        foreach (array_slice($items, 0, 50) as $item) {
            $sku = trim((string) ($item['product_sku'] ?? ''));
            $description = Str::limit(trim($item['description']), 250, '…');
            $product = ($sku !== '' ? Product::where('sku', $sku)->first() : null)
                ?? Product::where('name', $description)->first();
            $quantity = (string) max(0.01, round((float) $item['quantity'], 2));

            if ($product === null) {
                $unmatched[] = "{$quantity} × {$description}";
            }

            $lines[] = [
                'product_id' => $product?->id,
                'description' => $product->name ?? $description,
                'quantity' => $quantity,
                'unit_price' => $product->unit_price ?? '0',
                'discount_percent' => '0',
                'tax_rate' => $product->tax_rate ?? '0',
            ];
        }

        return [$lines, $unmatched];
    }

    public function failed(?Throwable $e): void
    {
        $this->email->update(['ai_status' => 'failed', 'ai_error' => Str::limit((string) $e?->getMessage(), 490, '…')]);
    }
}
