<?php

use App\Http\Controllers\Api\V1\RecordController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
| REST API v1: Sanctum personal access tokens (Settings → API tokens). "read" tokens may
| GET; "write" tokens may also create, update and delete.
*/
Route::prefix('v1')->name('api.v1.')->middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('me', fn (Request $request) => $request->user()?->only(['id', 'name', 'email']))
        ->middleware('abilities:read')->name('me');

    foreach (array_keys(RecordController::TYPES) as $type) {
        Route::apiResource($type, RecordController::class)->only(['index', 'show'])->middleware('abilities:read');
        Route::apiResource($type, RecordController::class)->only(['store', 'update', 'destroy'])->middleware('abilities:write');
    }
});
