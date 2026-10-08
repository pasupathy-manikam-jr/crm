<?php

namespace App\Http\Controllers;

use App\Http\Requests\Users\HolidayRequest;
use App\Models\Holiday;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('holidays/index', [
            'holidays' => Holiday::orderByDesc('date')->get(['id', 'date', 'name']),
            'businessHours' => config('app.business_hours'),
        ]);
    }

    public function store(HolidayRequest $request): RedirectResponse
    {
        $holiday = Holiday::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added.', ['name' => $holiday->name])]);

        return back();
    }

    public function update(HolidayRequest $request, Holiday $holiday): RedirectResponse
    {
        $holiday->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $holiday->name])]);

        return back();
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        $holiday->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $holiday->name])]);

        return back();
    }
}
