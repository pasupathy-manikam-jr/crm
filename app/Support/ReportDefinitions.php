<?php

namespace App\Support;

use App\Models\Account;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\Stage;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * What the report builder may group and measure, per record type. Every SQL fragment is
 * a fixed string chosen from these lists, never built from user input.
 */
final class ReportDefinitions
{
    /**
     * @return array<string, array{label: string, model: class-string<Model>, groups: array<string, array{0: string, 1: literal-string}>, measures: array<string, array{0: string, 1: literal-string}>}>
     */
    public static function modules(): array
    {
        return [
            'leads' => [
                'label' => 'Leads', 'model' => Lead::class,
                'groups' => ['owner' => ['Owner', 'owner_id'], 'status' => ['Status', 'status'], 'source' => ['Source', 'source'], 'month' => ['Month added', "date_format(created_at, '%Y-%m')"]],
                'measures' => ['count' => ['Number of leads', 'count(*)']],
            ],
            'deals' => [
                'label' => 'Deals', 'model' => Deal::class,
                'groups' => ['stage' => ['Stage', 'stage_id'], 'owner' => ['Owner', 'owner_id'], 'account' => ['Account', 'account_id'], 'close_month' => ['Expected close month', "date_format(expected_close_date, '%Y-%m')"], 'month' => ['Month added', "date_format(created_at, '%Y-%m')"]],
                'measures' => ['count' => ['Number of deals', 'count(*)'], 'amount' => ['Total amount', 'coalesce(sum(amount), 0)'], 'weighted' => ['Weighted amount', 'coalesce(sum(amount * probability / 100), 0)']],
            ],
            'quotes' => [
                'label' => 'Quotes', 'model' => Quote::class,
                'groups' => ['status' => ['Status', 'status'], 'owner' => ['Owner', 'owner_id'], 'account' => ['Account', 'account_id'], 'month' => ['Month created', "date_format(created_at, '%Y-%m')"]],
                'measures' => ['count' => ['Number of quotes', 'count(*)'], 'total' => ['Total value', 'coalesce(sum(total), 0)']],
            ],
            'accounts' => [
                'label' => 'Accounts', 'model' => Account::class,
                'groups' => ['industry' => ['Industry', 'industry'], 'owner' => ['Owner', 'owner_id'], 'month' => ['Month added', "date_format(created_at, '%Y-%m')"]],
                'measures' => ['count' => ['Number of accounts', 'count(*)']],
            ],
            'contacts' => [
                'label' => 'Contacts', 'model' => Contact::class,
                'groups' => ['account' => ['Account', 'account_id'], 'owner' => ['Owner', 'owner_id'], 'month' => ['Month added', "date_format(created_at, '%Y-%m')"]],
                'measures' => ['count' => ['Number of contacts', 'count(*)']],
            ],
            'activities' => [
                'label' => 'Activities', 'model' => Activity::class,
                'groups' => ['type' => ['Type', 'type'], 'owner' => ['Assigned to', 'owner_id'], 'done' => ['Open or done', "if(done_at is null, 'Open', 'Done')"], 'month' => ['Month created', "date_format(created_at, '%Y-%m')"]],
                'measures' => ['count' => ['Number of activities', 'count(*)']],
            ],
        ];
    }

    /**
     * Turn grouped keys into names people read: users, stages and accounts by name,
     * enum values capitalised, empty as "None".
     *
     * @param  list<string|int|null>  $keys
     * @return array<string, string>
     */
    public static function labels(string $group, array $keys): array
    {
        $ids = array_values(array_filter($keys, 'is_numeric'));
        $names = match ($group) {
            'owner' => User::whereKey($ids)->pluck('name', 'id')->all(),
            'stage' => Stage::whereKey($ids)->pluck('name', 'id')->all(),
            'account' => Account::withoutGlobalScopes()->whereKey($ids)->pluck('name', 'id')->all(),
            default => [],
        };

        $labels = [];
        foreach ($keys as $key) {
            $labels[(string) $key] = match (true) {
                $key === null || $key === '' => __('None'),
                isset($names[$key]) => $names[$key],
                in_array($group, ['status', 'source', 'type', 'done'], true) => __(ucfirst((string) $key)),
                default => (string) $key,
            };
        }

        return $labels;
    }
}
