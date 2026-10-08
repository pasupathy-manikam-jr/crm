<?php

namespace App\Http\Controllers;

use App\Enums\CustomFieldType;
use App\Http\Requests\Users\FieldDefinitionRequest;
use App\Models\FieldDefinition;
use App\Support\CrmRecords;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin screen for custom fields. Inactive hides a field but keeps stored values;
 * delete removes the field and its values.
 */
class FieldDefinitionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('custom-fields/index', [
            'fields' => FieldDefinition::orderBy('entity')->orderBy('position')->orderBy('id')->get(),
            'types' => CustomFieldType::options(),
        ]);
    }

    public function store(FieldDefinitionRequest $request): RedirectResponse
    {
        $entity = (string) $request->validated('entity');
        $base = Str::limit(Str::snake(Str::ascii((string) $request->validated('label'))), 50, '') ?: 'field';
        $key = $base;

        for ($n = 2; FieldDefinition::where('entity', $entity)->where('key', $key)->exists(); $n++) {
            $key = "{$base}_{$n}";
        }

        $field = FieldDefinition::create([
            ...$request->validated(),
            'key' => $key,
            'position' => (int) FieldDefinition::where('entity', $entity)->max('position') + 1,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name added.', ['name' => $field->label])]);

        return back();
    }

    public function update(FieldDefinitionRequest $request, FieldDefinition $field): RedirectResponse
    {
        $field->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name updated.', ['name' => $field->label])]);

        return back();
    }

    /**
     * Remove the field and wipe its stored value from every record of that type.
     * (To hide a field but keep the values, set it Inactive instead.)
     */
    public function destroy(FieldDefinition $field): RedirectResponse
    {
        $table = (new (CrmRecords::TYPES[$field->entity]))->getTable();

        DB::transaction(function () use ($field, $table): void {
            DB::update("update {$table} set custom_fields = json_remove(custom_fields, ?) where custom_fields is not null", ['$.'.$field->key]);
            $field->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $field->label])]);

        return back();
    }
}
