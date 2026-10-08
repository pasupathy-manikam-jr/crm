<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A named set of list filters one user saved for one list page.
 *
 * @property int $id
 * @property int $user_id
 * @property string $list
 * @property string $name
 * @property array<string, string> $query
 */
#[Fillable(['list', 'name', 'query'])]
class SavedView extends Model
{
    public const LISTS = ['accounts', 'contacts', 'leads', 'deals', 'quotes', 'cases', 'contracts', 'activities'];

    /**
     * Query keys a view may store; anything else in the request is dropped.
     */
    public const KEYS = ['search', 'owner', 'status', 'sort', 'direction', 'view', 'tab'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['query' => 'array'];
    }
}
