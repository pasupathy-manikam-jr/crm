<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ListsRecords;
use App\Models\Account;
use App\Models\Contact;
use App\Models\Lead;
use App\Support\CsvSchema;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CsvController extends Controller
{
    use ListsRecords;

    private const MAX_ROWS = 5000;

    /**
     * Download the list as CSV, with the same search, owner and status filters the page uses.
     */
    public function export(Request $request, string $type): StreamedResponse
    {
        $fields = array_keys(CsvSchema::fields($type));
        $query = $this->filterRecords($request, CsvSchema::model($type)::query()->with('owner:id,name'), CsvSchema::searchable($type))
            ->when($type === 'contacts', fn ($q) => $q->with('account:id,name'))
            ->when($type === 'leads' && $request->filled('status'), fn ($q) => $q->where('status', (string) $request->query('status')))
            ->orderBy('id');

        return response()->streamDownload(function () use ($query, $fields, $type): void {
            $out = fopen('php://output', 'w');
            abort_if($out === false, 500);
            fputcsv($out, [...array_map(fn ($f) => __(CsvSchema::fields($type)[$f][0]), $fields), __('Owner'), __('Added')], escape: '');

            $query->chunk(500, function ($records) use ($out, $fields): void {
                /** @var Account|Contact|Lead $record */
                foreach ($records as $record) {
                    fputcsv($out, [
                        ...array_map(fn ($f) => $this->exportValue($record, $f), $fields),
                        $record->owner->name,
                        $record->created_at?->format('Y-m-d'),
                    ], escape: '');
                }
            });

            fclose($out);
        }, "{$type}-".now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }

    /**
     * Import rows from a CSV, using the column chosen for each field. Invalid rows are
     * skipped and reported; valid ones are created, owned by the importer.
     */
    public function import(Request $request, string $type): RedirectResponse
    {
        $fields = CsvSchema::fields($type);
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'map' => ['required', 'array'],
            'map.*' => ['nullable'],
        ], ['file.mimes' => __('Choose a .csv file.')]);

        // A field set to "none" (skip) or left out isn't imported.
        $map = array_filter(array_intersect_key($request->input('map', []), $fields), fn ($v) => is_numeric($v));
        $missing = array_diff(array_keys(array_filter($fields, fn ($f) => in_array('required', $f[1], true))), array_keys($map));

        if ($missing !== []) {
            return back()->withErrors(['map' => __('Choose a column for: :fields.', ['fields' => implode(', ', array_map(fn ($f) => __($fields[$f][0]), $missing))])]);
        }

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        abort_if($handle === false, 422);
        fgetcsv($handle, escape: ''); // header row

        $created = 0;
        $skipped = [];
        $line = 1;
        $accounts = $type === 'contacts' ? Account::pluck('id', 'name')->mapWithKeys(fn ($id, $name) => [mb_strtolower($name) => $id]) : collect();

        DB::transaction(function () use ($handle, $map, $fields, $type, $request, $accounts, &$created, &$skipped, &$line): void {
            while (($row = fgetcsv($handle, escape: '')) !== false) {
                $line++;

                if ($line - 1 > self::MAX_ROWS) {
                    $skipped[] = __('Stopped after :max rows; split the file to import the rest.', ['max' => self::MAX_ROWS]);
                    break;
                }

                if ($row === [null] || trim(implode('', $row)) === '') {
                    continue;
                }

                $data = [];
                foreach ($map as $field => $column) {
                    $value = trim((string) ($row[(int) $column] ?? ''));
                    $data[$field] = $value === '' ? null : ($field === 'source' || $field === 'status' ? mb_strtolower($value) : $value);

                    // Yes/no custom fields round-trip with export's "Yes"/"No".
                    if (in_array('boolean', $fields[$field][1], true) && $data[$field] !== null) {
                        $data[$field] = match (mb_strtolower($data[$field])) {
                            'yes', 'y', 'true' => '1',
                            'no', 'n', 'false' => '0',
                            default => $data[$field],
                        };
                    }
                }

                $validator = Validator::make($data, array_map(fn ($f) => $f[1], array_intersect_key($fields, $data)));

                if ($validator->fails()) {
                    $skipped[] = __('Row :line: :error', ['line' => $line, 'error' => $validator->errors()->first()]);

                    continue;
                }

                $values = $validator->validated();

                foreach ($values as $field => $value) {
                    if (str_starts_with($field, 'custom:')) {
                        $values['custom_fields'][substr($field, 7)] = $value;
                        unset($values[$field]);
                    }
                }

                if ($type === 'contacts') {
                    $values['account_id'] = isset($values['account']) ? $accounts->get(mb_strtolower($values['account'])) : null;
                    unset($values['account']);
                }

                CsvSchema::model($type)::create([...$values, 'owner_id' => $request->user()->id]);
                $created++;
            }
        });

        fclose($handle);

        Inertia::flash('toast', [
            'type' => $skipped === [] ? 'success' : 'warning',
            'message' => $skipped === []
                ? __(':created imported.', ['created' => $created])
                : __(':created imported, :skipped skipped.', ['created' => $created, 'skipped' => count($skipped)]),
        ]);

        Inertia::flash('importSkipped', array_slice($skipped, 0, 20));

        return back();
    }

    private function exportValue(Model $record, string $field): mixed
    {
        if ($field === 'account' && $record instanceof Contact) {
            return $record->account?->name;
        }

        if (str_starts_with($field, 'custom:')) {
            $value = $record->getAttribute('custom_fields')[substr($field, 7)] ?? null;

            return is_bool($value) ? ($value ? 'Yes' : 'No') : $value;
        }

        $value = $record->getAttribute($field);

        return $value instanceof \BackedEnum ? $value->value : $value;
    }
}
