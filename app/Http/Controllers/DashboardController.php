<?php

namespace App\Http\Controllers;

use App\Enums\StageKind;
use App\Models\Activity;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Stage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The pipeline at a glance. Every query goes through the visibility scopes, so reps see
 * their own numbers, managers their team's and admins everyone's.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $open = Deal::whereNull('closed_at');
        $month = [now()->startOfMonth(), now()->endOfMonth()];
        $closedThisMonth = fn (StageKind $kind) => Deal::whereBetween('closed_at', $month)
            ->whereHas('stage', fn (Builder $q) => $q->where('kind', $kind));

        $won = $closedThisMonth(StageKind::Won);
        $wonCount = $won->clone()->count();
        $lostCount = $closedThisMonth(StageKind::Lost)->count();

        $byStage = Stage::where('kind', StageKind::Open)->orderBy('position')->get(['id', 'name'])
            ->map(function (Stage $stage) use ($open): array {
                $deals = $open->clone()->where('stage_id', $stage->id);

                return ['id' => $stage->id, 'name' => $stage->name, 'count' => $deals->count(), 'amount' => (float) $deals->sum('amount')];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'openAmount' => (float) $open->clone()->sum('amount'),
                'openCount' => $open->clone()->count(),
                'weightedAmount' => (float) $open->clone()->selectRaw('coalesce(sum(amount * probability / 100), 0) as w')->value('w'),
                'wonAmount' => (float) $won->clone()->sum('amount'),
                'wonCount' => $wonCount,
                'winRate' => $wonCount + $lostCount > 0 ? round($wonCount / ($wonCount + $lostCount) * 100) : null,
                'newLeads' => Lead::whereBetween('created_at', $month)->count(),
            ],
            'byStage' => $byStage,
            'tasks' => Activity::needsAttention()->where('owner_id', $request->user()->id)->with('regarding')
                ->orderBy('due_at')->limit(6)->get()->map(fn (Activity $a) => ActivityController::present($a)),
            'closingSoon' => $open->clone()->with('account:id,name')->whereBetween('expected_close_date', [today(), today()->addDays(30)])
                ->orderBy('expected_close_date')->limit(6)->get(['id', 'name', 'account_id', 'amount', 'probability', 'expected_close_date']),
        ]);
    }
}
