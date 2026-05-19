<?php

namespace App\Http\Controllers;

use App\Models\MasterCountry;
use App\Models\MasterDistrict;
use App\Models\MasterOffice;
use App\Models\MasterState;
use App\Support\AccessScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MasterDataController extends Controller
{
    private const CONFIG = [
        'countries' => [
            'model' => MasterCountry::class,
            'primary_key' => 'id',
            'module' => 'masters.countries',
            'search' => ['name', 'iso2', 'iso3', 'phone_code', 'currency', 'nationality'],
            'file_dir' => 'masters/countries',
        ],
        'states' => [
            'model' => MasterState::class,
            'primary_key' => 'id',
            'module' => 'masters.states',
            'search' => ['name', 'state_code'],
            'file_dir' => 'masters/states',
        ],
        'districts' => [
            'model' => MasterDistrict::class,
            'primary_key' => 'id',
            'module' => 'masters.districts',
            'search' => ['name', 'district_code'],
            'file_dir' => 'masters/districts',
        ],
        'offices' => [
            'model' => MasterOffice::class,
            'primary_key' => 'ofc_id',
            'module' => 'masters.offices',
            'search' => ['office_code', 'office_name', 'company_name', 'district', 'state', 'country'],
            'file_dir' => 'masters/offices',
        ],
    ];

    public function index(Request $request, string $type): JsonResponse
    {
        $config = $this->config($type);
        abort_unless(AccessScope::can($request->user(), $config['module'], 'read'), 403, 'You do not have read permission.');

        /** @var class-string<Model> $model */
        $model = $config['model'];

        $query = $model::query();
        $this->applyUserScope($query, $request, $type);
        $search = trim((string) $request->query('search', ''));

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($config, $search): void {
                foreach ($config['search'] as $column) {
                    $builder->orWhere($column, 'like', "%{$search}%");
                }
            });
        }

        if ($request->filled('status')) {
            $query->where('status', (int) $request->query('status'));
        }

        foreach (['country_id', 'state_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->query($filter));
            }
        }

        $rows = $query
            ->orderBy($config['primary_key'])
            ->paginate((int) $request->query('per_page', 10))
            ->through(fn (Model $row) => $this->payload($row, $config['primary_key']));

        return response()->json($rows);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $config = $this->config($type);
        abort_unless(AccessScope::can($request->user(), $config['module'], 'create'), 403, 'You do not have create permission.');

        $data = $this->validated($request, $type);
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data = $this->storeFile($request, $config, $data);

        /** @var class-string<Model> $model */
        $model = $config['model'];
        $row = $model::query()->create($data);

        return response()->json([
            'message' => 'Master record created successfully.',
            'data' => $this->payload($row->fresh(), $config['primary_key']),
        ], 201);
    }

    public function update(Request $request, string $type, string $id): JsonResponse
    {
        $config = $this->config($type);
        abort_unless(AccessScope::can($request->user(), $config['module'], 'edit'), 403, 'You do not have edit permission.');

        $row = $this->findRow($config, $id, $request);
        $data = $this->validated($request, $type, $row);
        $data['updated_by'] = $request->user()->id;
        $data = $this->storeFile($request, $config, $data, $row);

        $row->fill($data)->save();

        return response()->json([
            'message' => 'Master record updated successfully.',
            'data' => $this->payload($row->fresh(), $config['primary_key']),
        ]);
    }

    public function destroy(Request $request, string $type, string $id): JsonResponse
    {
        $config = $this->config($type);
        abort_unless(AccessScope::can($request->user(), $config['module'], 'delete'), 403, 'You do not have delete permission.');

        $row = $this->findRow($config, $id, $request);

        if ($row->getAttribute('attachment_path')) {
            Storage::disk('public')->delete($row->getAttribute('attachment_path'));
        }

        $row->delete();

        return response()->json(['message' => 'Master record deleted successfully.']);
    }

    public function options(Request $request): JsonResponse
    {
        $countries = MasterCountry::query()->where('status', 1);
        $states = MasterState::query()->where('status', 1);

        $user = $request->user();
        $access = AccessScope::payload($user);
        if (! $access['is_super_admin']) {
            if ((int) $user->role !== 2) {
                $countries->where('created_by', $user->id);
                $states->where('created_by', $user->id);
            } else {
                $countryIds = collect($access['country_ids'])->map(fn ($id) => (int) $id);
                $stateIds = collect($access['state_ids'])->map(fn ($id) => (int) $id);

                if ($access['district_ids']) {
                    $districts = MasterDistrict::query()->whereIn('id', $access['district_ids'])->get(['country_id', 'state_id']);
                    $countryIds = $countryIds->merge($districts->pluck('country_id'));
                    $stateIds = $stateIds->merge($districts->pluck('state_id'));
                }

                if ($stateIds->isNotEmpty()) {
                    $stateCountries = MasterState::query()->whereIn('id', $stateIds)->pluck('country_id');
                    $countryIds = $countryIds->merge($stateCountries);
                }

                $countryIds = $countryIds->filter()->unique()->values();
                $stateIds = $stateIds->filter()->unique()->values();

                $countryIds->isNotEmpty() ? $countries->whereIn('id', $countryIds) : $countries->whereRaw('1 = 0');
                $stateIds->isNotEmpty() ? $states->whereIn('id', $stateIds) : $states->whereRaw('1 = 0');
            }
        }

        return response()->json([
            'countries' => $countries->orderBy('name')->get(['id', 'name']),
            'states' => $states->orderBy('name')->get(['id', 'country_id', 'name']),
        ]);
    }

    private function config(string $type): array
    {
        if (! isset(self::CONFIG[$type])) {
            throw ValidationException::withMessages(['type' => 'Invalid master type.']);
        }

        return self::CONFIG[$type];
    }

    private function applyUserScope(Builder $query, Request $request, string $type): void
    {
        $access = AccessScope::payload($request->user());

        if ($access['is_super_admin']) {
            return;
        }

        if ((int) $request->user()->role !== 2) {
            $query->where('created_by', $request->user()->id);
            return;
        }

        if (in_array($type, ['countries', 'offices'], true)) {
            $query->whereRaw('1 = 0');
            return;
        }

        if ($type === 'states' && $access['state_ids']) {
            $query->whereIn('id', $access['state_ids']);
            return;
        }

        if ($type === 'states' && $access['district_ids']) {
            $stateIds = MasterDistrict::query()->whereIn('id', $access['district_ids'])->pluck('state_id');
            $query->whereIn('id', $stateIds);
            return;
        }

        if ($type === 'districts') {
            if ($access['district_ids']) {
                $query->whereIn('id', $access['district_ids']);
                return;
            } elseif ($access['state_ids']) {
                $query->whereIn('state_id', $access['state_ids']);
                return;
            } elseif ($access['country_ids']) {
                $query->whereIn('country_id', $access['country_ids']);
                return;
            }
        }

        if ($type === 'offices') {
            if ($access['office_ids']) {
                $query->whereIn('ofc_id', $access['office_ids']);
                return;
            } elseif ($access['district_ids']) {
                $districtNames = MasterDistrict::query()->whereIn('id', $access['district_ids'])->pluck('name');
                $query->whereIn('district', $districtNames);
                return;
            } elseif ($access['state_ids']) {
                $stateNames = MasterState::query()->whereIn('id', $access['state_ids'])->pluck('name');
                $query->whereIn('state', $stateNames);
                return;
            }
        }

        $query->whereRaw('1 = 0');
    }

    private function validated(Request $request, string $type, ?Model $row = null): array
    {
        $statusRule = ['nullable', 'integer', Rule::in([0, 1])];
        $fileRule = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'];

        $rules = match ($type) {
            'countries' => [
                'name' => ['required', 'string', 'max:100'],
                'iso2' => ['required', 'string', 'size:2', $this->uniqueRule('master_countries', 'iso2', $row)],
                'iso3' => ['nullable', 'string', 'size:3', $this->uniqueRule('master_countries', 'iso3', $row)],
                'phone_code' => ['nullable', 'string', 'max:10'],
                'currency' => ['nullable', 'string', 'max:10'],
                'currency_symbol' => ['nullable', 'string', 'max:10'],
                'nationality' => ['nullable', 'string', 'max:100'],
                'status' => $statusRule,
                'attachment' => $fileRule,
            ],
            'states' => [
                'country_id' => ['required', 'integer', 'exists:master_countries,id'],
                'name' => ['required', 'string', 'max:100'],
                'state_code' => ['nullable', 'string', 'max:10'],
                'status' => $statusRule,
                'attachment' => $fileRule,
            ],
            'districts' => [
                'country_id' => ['required', 'integer', 'exists:master_countries,id'],
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'name' => ['required', 'string', 'max:100'],
                'district_code' => ['nullable', 'string', 'max:10'],
                'status' => $statusRule,
                'attachment' => $fileRule,
            ],
            'offices' => [
                'office_code' => ['nullable', 'string', 'max:20', $this->uniqueRule('master_offices', 'office_code', $row, 'ofc_id')],
                'office_name' => ['required', 'string', 'max:100'],
                'company_name' => ['nullable', 'string', 'max:100'],
                'office_type' => ['nullable', 'integer', Rule::in([1, 2])],
                'ofc_parent_id' => ['nullable', 'integer'],
                'district' => ['nullable', 'string', 'max:100'],
                'state' => ['nullable', 'string', 'max:100'],
                'country' => ['nullable', 'string', 'max:100'],
                'status' => $statusRule,
                'attachment' => $fileRule,
            ],
        };

        $data = $request->validate($rules);
        unset($data['attachment']);

        $data['status'] = (int) ($data['status'] ?? 1);

        if ($type === 'offices') {
            $data['office_type'] = (int) ($data['office_type'] ?? 1);
            $data['ofc_parent_id'] = (int) ($data['ofc_parent_id'] ?? 0);
        }

        return $data;
    }

    private function uniqueRule(string $table, string $column, ?Model $row, string $primaryKey = 'id'): mixed
    {
        $rule = Rule::unique($table, $column);

        return $row ? $rule->ignore($row->getKey(), $primaryKey) : $rule;
    }

    private function storeFile(Request $request, array $config, array $data, ?Model $row = null): array
    {
        if (! $request->hasFile('attachment')) {
            return $data;
        }

        if ($row?->getAttribute('attachment_path')) {
            Storage::disk('public')->delete($row->getAttribute('attachment_path'));
        }

        $data['attachment_path'] = $request->file('attachment')->store($config['file_dir'], 'public');

        return $data;
    }

    private function findRow(array $config, string $id, ?Request $request = null): Model
    {
        /** @var class-string<Model> $model */
        $model = $config['model'];

        $query = $model::query()->where($config['primary_key'], $id);

        if ($request) {
            $type = array_search($config, self::CONFIG, true);
            if (is_string($type)) {
                $this->applyUserScope($query, $request, $type);
            }
        }

        return $query->firstOrFail();
    }

    private function payload(?Model $row, string $primaryKey): ?array
    {
        if (! $row) {
            return null;
        }

        $data = $row->toArray();
        $path = $row->getAttribute('attachment_path');

        $data['key'] = $row->getAttribute($primaryKey);
        $data['attachment_url'] = $path ? Storage::disk('public')->url($path) : null;

        return $data;
    }
}
