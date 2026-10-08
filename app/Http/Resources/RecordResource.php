<?php

namespace App\Http\Resources;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Any CRM record over the API (and in webhook payloads): its type, its columns with casts
 * applied (enums as values, dates as Y-m-d or ISO 8601), custom_fields, and its web URL.
 *
 * @mixin Model
 */
class RecordResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Model $record */
        $record = $this->resource;
        $type = $record->getMorphClass();

        return [
            'type' => $type,
            ...collect($record->attributesToArray())->except(['deleted_at'])->all(),
            'url' => route(Str::plural($type).'.show', $record),
        ];
    }
}
