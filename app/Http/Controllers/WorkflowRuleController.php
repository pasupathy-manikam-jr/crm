<?php

namespace App\Http\Controllers;

use App\Http\Requests\Users\WorkflowRuleRequest;
use App\Models\WorkflowRule;
use App\Support\Workflows;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowRuleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('workflows/index', [
            'rules' => WorkflowRule::orderBy('module')->orderBy('id')->get(),
            'modules' => Workflows::definitions(),
            'events' => array_map(fn (string $label): string => __($label), Workflows::EVENTS),
            'operators' => array_map(fn (string $label): string => __($label), Workflows::OPERATORS),
            'unary' => Workflows::UNARY,
        ]);
    }

    public function store(WorkflowRuleRequest $request): RedirectResponse
    {
        $rule = WorkflowRule::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rule “:name” added.', ['name' => $rule->name])]);

        return back();
    }

    public function update(WorkflowRuleRequest $request, WorkflowRule $workflow): RedirectResponse
    {
        $workflow->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rule “:name” saved.', ['name' => $workflow->name])]);

        return back();
    }

    public function destroy(WorkflowRule $workflow): RedirectResponse
    {
        $workflow->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rule “:name” deleted.', ['name' => $workflow->name])]);

        return back();
    }
}
