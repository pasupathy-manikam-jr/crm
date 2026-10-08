<?php

namespace App\Models;

use Database\Factories\WorkflowRuleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * "When a <module> is <event> and every condition holds, run the actions" (see App\Support\Workflows).
 *
 * @property int $id
 * @property string $name
 * @property string $module
 * @property string $event
 * @property list<array{field: string, operator: string, value?: string|null}> $conditions
 * @property list<array<string, mixed>> $actions
 * @property bool $active
 * @property int $runs_count
 */
#[Fillable(['name', 'module', 'event', 'conditions', 'actions', 'active'])]
class WorkflowRule extends Model
{
    /** @use HasFactory<WorkflowRuleFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'conditions' => 'array',
            'actions' => 'array',
            'active' => 'boolean',
        ];
    }
}
