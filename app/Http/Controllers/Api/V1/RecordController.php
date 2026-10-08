<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Crm\AccountRequest;
use App\Http\Requests\Crm\ContactRequest;
use App\Http\Requests\Crm\ContractRequest;
use App\Http\Requests\Crm\DealRequest;
use App\Http\Requests\Crm\LeadRequest;
use App\Http\Requests\Crm\SupportCaseRequest;
use App\Http\Resources\RecordResource;
use App\Support\CrmRecords;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/**
 * REST endpoints for leads, contacts, accounts, deals, cases and contracts (api/v1/<type>).
 * The token's user is the signed-in user, so their visibility applies (others' records are
 * 404) and writes go through the same form requests as the app.
 */
class RecordController extends Controller
{
    /**
     * Per list: the form request that validates writes, and the columns ?search= matches.
     *
     * @var array<string, array{0: class-string<FormRequest>, 1: list<string>}>
     */
    public const TYPES = [
        'leads' => [LeadRequest::class, ['first_name', 'last_name', 'company', 'email', 'phone']],
        'contacts' => [ContactRequest::class, ['first_name', 'last_name', 'email', 'phone']],
        'accounts' => [AccountRequest::class, ['name', 'email', 'phone']],
        'deals' => [DealRequest::class, ['name']],
        'cases' => [SupportCaseRequest::class, ['number', 'subject']],
        'contracts' => [ContractRequest::class, ['name']],
    ];

    /**
     * Paginated, oldest first. Filters: search, updated_since (for syncing), owner_id,
     * status (where the type has one), stage_id (deals), per_page (max 100).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        [$type, $model] = $this->type($request);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'updated_since' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'string', 'max:30'],
            'stage_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $search = $filters['search'] ?? null;

        $records = $model::query()
            ->when($search, fn (Builder $q) => $q->where(function (Builder $q) use ($type, $search): void {
                foreach (self::TYPES[$type][1] as $column) {
                    $q->orWhere($column, 'like', '%'.addcslashes((string) $search, '%_\\').'%');
                }
            }))
            ->when($filters['updated_since'] ?? null, fn (Builder $q, string $since) => $q->where('updated_at', '>=', now()->parse($since)))
            ->when($filters['owner_id'] ?? null, fn (Builder $q, int|string $id) => $q->where('owner_id', (int) $id))
            ->when(in_array($type, ['leads', 'cases', 'contracts'], true) ? ($filters['status'] ?? null) : null, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($type === 'deals' ? ($filters['stage_id'] ?? null) : null, fn (Builder $q, int|string $id) => $q->where('stage_id', (int) $id))
            ->orderBy('id')
            ->paginate((int) ($filters['per_page'] ?? 25))
            ->withQueryString();

        return RecordResource::collection($records);
    }

    public function show(Request $request): RecordResource
    {
        return new RecordResource($this->record($request));
    }

    /**
     * Owner defaults to the token's user.
     */
    public function store(Request $request): JsonResponse
    {
        [$type, $model] = $this->type($request);
        $request->mergeIfMissing(['owner_id' => $request->user()->id]);

        $record = $model::create($this->validated($type));

        return (new RecordResource($record))->response()->setStatusCode(201);
    }

    /**
     * PUT or PATCH: fields left out keep their values (custom_fields merge key by key).
     */
    public function update(Request $request): RecordResource
    {
        [$type] = $this->type($request);
        $record = $this->record($request);
        $current = array_intersect_key($record->attributesToArray(), array_flip($record->getFillable()));

        $request->mergeIfMissing($current);
        $request->merge(['custom_fields' => [...$record->getAttribute('custom_fields'), ...(array) $request->input('custom_fields', [])]]);

        $record->update($this->validated($type));

        return new RecordResource($record->refresh());
    }

    public function destroy(Request $request): Response
    {
        $this->record($request)->delete();

        return response()->noContent();
    }

    /**
     * The list this route serves (from its name, api.v1.<type>.<action>) and its model.
     *
     * @return array{0: string, 1: class-string<Model>}
     */
    private function type(Request $request): array
    {
        $type = explode('.', (string) $request->route()?->getName())[2];

        return [$type, CrmRecords::TYPES[Str::singular($type)]];
    }

    /**
     * The bound record ({lead}, {case}, …; see AppServiceProvider's Route::model bindings).
     */
    private function record(Request $request): Model
    {
        [$type] = $this->type($request);

        /** @var Model */
        return $request->route(Str::singular($type));
    }

    /**
     * Validate the current request with the app's form request for this type.
     *
     * @return array<string, mixed>
     */
    private function validated(string $type): array
    {
        /** @var FormRequest $form */
        $form = app(self::TYPES[$type][0]);

        return $form->validated();
    }
}
