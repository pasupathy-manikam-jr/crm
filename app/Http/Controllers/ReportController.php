<?php

namespace App\Http\Controllers;

use App\Support\ReportDefinitions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Group-and-total reports over any record type. Visibility scopes apply, so each person
 * reports on what they can see.
 */
class ReportController extends Controller
{
    public function index(Request $request): Response|StreamedResponse
    {
        $modules = ReportDefinitions::modules();
        $module = array_key_exists((string) $request->query('module'), $modules) ? (string) $request->query('module') : 'deals';
        $def = $modules[$module];
        $groups = $def['groups'];
        $measures = $def['measures'];
        $group = array_key_exists((string) $request->query('group'), $groups) ? (string) $request->query('group') : (string) array_key_first($groups);
        $measure = array_key_exists((string) $request->query('measure'), $measures) ? (string) $request->query('measure') : (string) (array_keys($measures)[1] ?? array_key_first($measures)); // first money measure, else count
        $from = $this->date($request->query('from'));
        $to = $this->date($request->query('to'));

        $rows = $def['model']::query()
            ->selectRaw($groups[$group][1].' as k')
            ->selectRaw($measures[$measure][1].' as v')
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from.' 00:00:00'))
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to.' 23:59:59'))
            ->groupBy('k')
            ->orderByDesc('v')
            ->limit(100)
            ->get();

        /** @var list<string|int|null> $keys */
        $keys = $rows->pluck('k')->map(fn ($k) => $k instanceof \BackedEnum ? $k->value : $k)->values()->all();
        $labels = ReportDefinitions::labels($group, $keys);
        $result = $rows->map(function ($row) use ($labels): array {
            $key = $row->getAttribute('k');
            $key = $key instanceof \BackedEnum ? $key->value : $key;

            return ['label' => $labels[(string) $key] ?? __('None'), 'value' => (float) $row->getAttribute('v')];
        })->values();

        if (in_array($group, ['month', 'close_month'], true)) {
            $result = $result->sortBy('label')->values();
        }

        if ($request->query('format') === 'csv') {
            return response()->streamDownload(function () use ($result, $groups, $measures, $group, $measure): void {
                $out = fopen('php://output', 'w');
                abort_if($out === false, 500);
                fputcsv($out, [__($groups[$group][0]), __($measures[$measure][0])], escape: '');
                foreach ($result as $row) {
                    fputcsv($out, [$row['label'], $row['value']], escape: '');
                }
                fclose($out);
            }, "report-{$module}-{$group}.csv", ['Content-Type' => 'text/csv']);
        }

        return Inertia::render('reports/index', [
            'modules' => collect($modules)->map(fn (array $m, string $key) => [
                'value' => $key,
                'label' => __($m['label']),
                'groups' => collect($m['groups'])->map(fn ($g, $k) => ['value' => $k, 'label' => __($g[0])])->values(),
                'measures' => collect($m['measures'])->map(fn ($g, $k) => ['value' => $k, 'label' => __($g[0]), 'money' => $k !== 'count'])->values(),
            ])->values(),
            'filters' => ['module' => $module, 'group' => $group, 'measure' => $measure, 'from' => $from ?? '', 'to' => $to ?? ''],
            'rows' => $result,
            'total' => $result->sum('value'),
        ]);
    }

    private function date(mixed $value): ?string
    {
        return is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? $value : null;
    }
}
