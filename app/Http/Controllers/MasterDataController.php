<?php

namespace App\Http\Controllers;

use App\Models\MasterCountry;
use App\Models\MasterNPCity;
use App\Models\MasterNPWard;
use App\Models\MasterNPPollingStation;
use App\Models\MasterRPCity;
use App\Models\MasterRPWard;
use App\Models\MasterRPPollingStation;
use App\Models\MasterDepartment;
use App\Models\MasterDistrict;
use App\Models\MasterDesignation;
use App\Models\MasterEmployee;
use App\Models\MasterEmpType;
use App\Models\MasterOffice;
use App\Models\MasterPayLevel;
use App\Models\MasterState;
use App\Models\MasterNPMapping;
use App\Models\MasterRPMapping;
use App\Models\MasterElectionSalaryRule;
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
            'search' => ['name'],
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
            'search' => ['office_code', 'office_name', 'company_name'],
        ],
        'np-cities' => [
            'model' => MasterNPCity::class,
            'primary_key' => 'id',
            'module' => 'masters.cities',
            'search' => ['city_name', 'karyalay_name'],
            'file_dir' => 'masters/np-cities',
        ],
        'np-wards' => [
            'model' => MasterNPWard::class,
            'primary_key' => 'id',
            'module' => 'masters.wards',
            'search' => ['ward_no', 'ward_name'],
            'file_dir' => 'masters/np-wards',
        ],
        'np-polling-stations' => [
            'model' => MasterNPPollingStation::class,
            'primary_key' => 'id',
            'module' => 'masters.polling_stations',
            'search' => ['polling_station_name'],
            'file_dir' => 'masters/np-polling-stations',
        ],
        'rp-cities' => [
            'model' => MasterRPCity::class,
            'primary_key' => 'id',
            'module' => 'masters.cities',
            'search' => ['city_name', 'karyalay_name'],
            'file_dir' => 'masters/rp-cities',
        ],
        'rp-wards' => [
            'model' => MasterRPWard::class,
            'primary_key' => 'id',
            'module' => 'masters.wards',
            'search' => ['ward_no', 'ward_name'],
            'file_dir' => 'masters/rp-wards',
        ],
        'rp-polling-stations' => [
            'model' => MasterRPPollingStation::class,
            'primary_key' => 'id',
            'module' => 'masters.polling_stations',
            'search' => ['polling_station_name'],
            'file_dir' => 'masters/rp-polling-stations',
        ],
        'emp-types' => [
            'model' => MasterEmpType::class,
            'primary_key' => 'id',
            'module' => 'hrms.emp_types',
            'search' => ['emp_type'],
            'file_dir' => 'masters/emp-types',
        ],
        'designations' => [
            'model' => MasterDesignation::class,
            'primary_key' => 'id',
            'module' => 'hrms.designations',
            'search' => ['designation'],
            'file_dir' => 'masters/designations',
        ],
        'departments' => [
            'model' => MasterDepartment::class,
            'primary_key' => 'id',
            'module' => 'hrms.departments',
            'search' => ['department'],
            'file_dir' => 'masters/departments',
        ],
        'pay-levels' => [
            'model' => MasterPayLevel::class,
            'primary_key' => 'id',
            'module' => 'hrms.pay_levels',
            'search' => ['level', 'min_amount_pay', 'max_amount_pay', 'grade_pay'],
            'file_dir' => 'masters/pay-levels',
        ],
        'employees' => [
            'model' => MasterEmployee::class,
            'primary_key' => 'id',
            'module' => 'hrms.employees',
            'search' => ['emp_code', 'name', 'mobile', 'email'],
            'file_dir' => 'masters/employees',
        ],
    ];

    public function getSalaryRules(Request $request): JsonResponse
    {
        $rules = MasterElectionSalaryRule::query()
            ->orderBy('post_name')
            ->get();

        return response()->json($rules);
    }

    public function saveSalaryRules(Request $request): JsonResponse
    {
        $request->validate([
            'rules' => 'required|array|min:4|max:5',
            'rules.*.post_name' => 'required|string|in:P0,P1,P2,P3,P4',
            'rules.*.min_salary' => 'required|numeric|min:0',
            'rules.*.comparison_operator' => 'required|string|in:above,under',
        ]);

        $rulesInput = $request->input('rules');
        $user = $request->user();

        \Illuminate\Support\Facades\DB::transaction(function () use ($rulesInput, $user) {
            foreach ($rulesInput as $item) {
                MasterElectionSalaryRule::query()
                    ->where('post_name', $item['post_name'])
                    ->update([
                        'min_salary' => $item['min_salary'],
                        'comparison_operator' => $item['comparison_operator'],
                        'updated_at' => now(),
                    ]);
            }
        });

        return response()->json([
            'message' => 'Election salary rules updated successfully.',
        ]);
    }

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

        foreach (['country_id', 'state_id', 'district_id', 'city_id', 'ward_id'] as $filter) {
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

    public function search(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q', ''));

        if ($term === '') {
            return response()->json(['data' => []]);
        }

        $labels = [
            'countries' => ['group' => 'Countries', 'singular' => 'Country', 'title' => 'name'],
            'states' => ['group' => 'States', 'singular' => 'State', 'title' => 'name'],
            'districts' => ['group' => 'Districts', 'singular' => 'District', 'title' => 'name'],
            'offices' => ['group' => 'Offices', 'singular' => 'Office', 'title' => 'office_name'],
            'cities' => ['group' => 'Cities', 'singular' => 'City', 'title' => 'city_name'],
            'wards' => ['group' => 'Wards', 'singular' => 'Ward', 'title' => 'ward_name'],
            'polling-stations' => ['group' => 'Polling Stations', 'singular' => 'Polling Station', 'title' => 'polling_station_name'],
            'emp-types' => ['group' => 'Employee Types', 'singular' => 'Employee Type', 'title' => 'emp_type'],
            'designations' => ['group' => 'Designations', 'singular' => 'Designation', 'title' => 'designation'],
            'departments' => ['group' => 'Departments', 'singular' => 'Department', 'title' => 'department'],
            'pay-levels' => ['group' => 'Pay Levels', 'singular' => 'Pay Level', 'title' => 'level'],
            'employees' => ['group' => 'Employees', 'singular' => 'Employee', 'title' => 'name'],
        ];

        $results = collect();

        foreach (self::CONFIG as $type => $config) {
            if (! AccessScope::can($request->user(), $config['module'], 'read')) {
                continue;
            }

            /** @var class-string<Model> $model */
            $model = $config['model'];
            $query = $model::query();
            $this->applyUserScope($query, $request, $type);
            $query->where(function (Builder $builder) use ($config, $term): void {
                foreach ($config['search'] as $column) {
                    $builder->orWhere($column, 'like', "%{$term}%");
                }
            });

            $rows = $query
                ->orderBy($config['primary_key'])
                ->limit(4)
                ->get();

            foreach ($rows as $row) {
                $label = $labels[$type];
                $matchedColumn = collect($config['search'])->first(function (string $column) use ($row, $term): bool {
                    return str_contains(strtolower((string) $row->getAttribute($column)), strtolower($term));
                }) ?? $config['search'][0];
                $title = (string) ($row->getAttribute($label['title']) ?: $row->getAttribute($matchedColumn) ?: $label['singular']);

                $results->push([
                    'id' => "master-{$type}-".$row->getAttribute($config['primary_key']),
                    'title' => $title,
                    'group' => $label['group'],
                    'url' => $this->frontendUrl($type, $term),
                    'description' => "{$label['singular']} record matched ".str_replace('_', ' ', $matchedColumn).'.',
                ]);
            }
        }

        return response()->json([
            'data' => $results->take(12)->values(),
        ]);
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
            $this->deleteUploadedFile($row->getAttribute('attachment_path'));
        }

        $row->delete();

        return response()->json(['message' => 'Master record deleted successfully.']);
    }

    public function import(Request $request, string $type): JsonResponse
    {
        $config = $this->config($type);
        abort_unless(AccessScope::can($request->user(), $config['module'], 'create'), 403, 'You do not have create permission.');
        abort_unless(in_array($type, ['employees', 'np-cities', 'rp-cities'], true), 404, 'Import is not available for this master.');

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        if (! $handle) {
            throw ValidationException::withMessages(['file' => 'Unable to read the uploaded file.']);
        }

        $headers = fgetcsv($handle);
        if (! $headers) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'CSV header row is required.']);
        }

        $headerMap = $this->headerMap($headers, $this->importFields($type));
        $created = 0;
        $failed = [];
        $line = 1;

        while (($csvRow = fgetcsv($handle)) !== false) {
            $line++;
            if (count(array_filter($csvRow, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $rowData = [];
            foreach ($headerMap as $index => $key) {
                $rowData[$key] = trim((string) ($csvRow[$index] ?? ''));
            }
            $rowData = $this->normalizeImportRow($rowData, $type);

            try {
                $rowRequest = Request::create($request->path(), 'POST', $rowData);
                $rowRequest->setUserResolver(fn () => $request->user());
                $data = $this->validated($rowRequest, $type);
                $data['created_by'] = $request->user()->id;
                $data['updated_by'] = $request->user()->id;

                /** @var class-string<Model> $model */
                $model = $config['model'];
                $model::query()->create($data);
                $created++;
            } catch (ValidationException $exception) {
                $failed[] = [
                    'line' => $line,
                    'errors' => collect($exception->errors())->flatten()->values(),
                ];
            } catch (\Throwable $exception) {
                $failed[] = [
                    'line' => $line,
                    'errors' => [$exception->getMessage()],
                ];
            }
        }

        fclose($handle);

        return response()->json([
            'message' => "Import completed. Created: {$created}. Failed: ".count($failed).'.',
            'created' => $created,
            'failed' => $failed,
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $countries = MasterCountry::query()->where('status', 1);
        $states = MasterState::query()->where('status', 1);
        $districts = MasterDistrict::query()->where('status', 1);
        $npCities = MasterNPCity::query()->where('status', 1);
        $rpCities = MasterRPCity::query()->where('status', 1);
        $npWards = MasterNPWard::query()->where('status', 1);
        $rpWards = MasterRPWard::query()->where('status', 1);
        $offices = MasterOffice::query()->where('status', 1);
        $empTypes = MasterEmpType::query()->where('status', 1);
        $designations = MasterDesignation::query()->where('status', 1);
        $departments = MasterDepartment::query()->where('status', 1);
        $payLevels = MasterPayLevel::query()->where('status', 1);

        $user = $request->user();
        $access = AccessScope::payload($user);
        if (! $access['is_super_admin']) {
            if ((int) $user->role !== 2) {
                $countries->where('created_by', $user->id);
                $states->where('created_by', $user->id);
                $npCities->where('created_by', $user->id);
                $rpCities->where('created_by', $user->id);
                $npWards->where('created_by', $user->id);
                $rpWards->where('created_by', $user->id);
            } else {
                $countryIds = collect($access['country_ids'])->map(fn ($id) => (int) $id);
                $stateIds = collect($access['state_ids'])->map(fn ($id) => (int) $id);

                if ($access['district_ids']) {
                    $accessDistricts = MasterDistrict::query()->whereIn('id', $access['district_ids'])->get(['country_id', 'state_id']);
                    $countryIds = $countryIds->merge($accessDistricts->pluck('country_id'));
                    $stateIds = $stateIds->merge($accessDistricts->pluck('state_id'));
                }

                if ($stateIds->isNotEmpty()) {
                    $stateCountries = MasterState::query()->whereIn('id', $stateIds)->pluck('country_id');
                    $countryIds = $countryIds->merge($stateCountries);
                }

                $countryIds = $countryIds->filter()->unique()->values();
                $stateIds = $stateIds->filter()->unique()->values();

                $countryIds->isNotEmpty() ? $countries->whereIn('id', $countryIds) : $countries->whereRaw('1 = 0');
                $stateIds->isNotEmpty() ? $states->whereIn('id', $stateIds) : $states->whereRaw('1 = 0');
                $stateIds->isNotEmpty() ? $districts->whereIn('state_id', $stateIds) : $districts->whereRaw('1 = 0');
                $stateIds->isNotEmpty() ? $npCities->whereIn('state_id', $stateIds) : $npCities->whereRaw('1 = 0');
                $stateIds->isNotEmpty() ? $rpCities->whereIn('state_id', $stateIds) : $rpCities->whereRaw('1 = 0');
                $stateIds->isNotEmpty() ? $npWards->whereIn('state_id', $stateIds) : $npWards->whereRaw('1 = 0');
                $stateIds->isNotEmpty() ? $rpWards->whereIn('state_id', $stateIds) : $rpWards->whereRaw('1 = 0');
                $stateIds->isNotEmpty() ? $offices->whereIn('state_id', $stateIds) : $offices->whereRaw('1 = 0');
            }
        }

        $npCitiesList = $npCities->orderBy('city_name')->get(['id', 'state_id', 'district_id', 'city_name', 'karyalay_name']);
        $rpCitiesList = $rpCities->orderBy('city_name')->get(['id', 'state_id', 'district_id', 'city_name', 'karyalay_name']);
        $npWardsList = $npWards->orderBy('ward_no')->orderBy('ward_name')->get(['id', 'state_id', 'district_id', 'city_id', 'ward_no', 'ward_name']);
        $rpWardsList = $rpWards->orderBy('ward_no')->orderBy('ward_name')->get(['id', 'state_id', 'district_id', 'city_id', 'ward_no', 'ward_name']);

        return response()->json([
            'countries' => $countries->orderBy('name')->get(['id', 'name']),
            'states' => $states->orderBy('name')->get(['id', 'country_id', 'name']),
            'districts' => $districts->orderBy('name')->get(['id', 'country_id', 'state_id', 'name']),
            'np_cities' => $npCitiesList,
            'rp_cities' => $rpCitiesList,
            'np_wards' => $npWardsList,
            'rp_wards' => $rpWardsList,
            'offices' => $offices->orderBy('office_name')->get(['ofc_id', 'state_id', 'district_id', 'office_name']),
            'emp_types' => $empTypes->orderBy('emp_type')->get(['id', 'emp_type']),
            'designations' => $designations->orderBy('designation')->get(['id', 'designation']),
            'departments' => $departments->orderBy('department')->get(['id', 'department']),
            'pay_levels' => $payLevels->orderBy('level')->get(['id', 'level', 'min_amount_pay', 'max_amount_pay', 'grade_pay']),
        ]);
    }

    public function searchEmployees(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q', ''));
        $postName = $request->query('post_name');
        $cityType = $request->query('city_type');
        $cityId = $request->query('city_id');

        $query = MasterEmployee::query()->where('status', 1);

        if (!empty($cityType)) {
            $query->where('city_type', $cityType);
        }

        // 1. Exclude already assigned employees across both NP and RP mapping tables
        $assignedNP = MasterNPMapping::query()->whereNotNull('emp_id')->pluck('emp_id')->toArray();
        $assignedRP = MasterRPMapping::query()->whereNotNull('emp_id')->pluck('emp_id')->toArray();
        $assignedEmpIds = array_unique(array_merge($assignedNP, $assignedRP));

        if (!empty($assignedEmpIds)) {
            $query->whereNotIn('id', $assignedEmpIds);
        }

        // Resolve district ID
        $districtId = null;
        if (!empty($cityId) && !empty($cityType)) {
            $table = $cityType === 'urban' ? 'master_np_cities' : 'master_rp_cities';
            $districtId = \Illuminate\Support\Facades\DB::table($table)->where('id', $cityId)->value('district_id');
        }

        if (!$districtId) {
            $user = $request->user();
            $districtId = $user->district_id ?: (AccessScope::payload($user)['district_ids'][0] ?? null);
        }

        // Load district configurations
        $distConfig = null;
        if ($districtId) {
            $distConfig = \Illuminate\Support\Facades\DB::table('district_election_configs')->where('district_id', $districtId)->first();
        }

        // Apply DOB limits from district config
        if ($distConfig) {
            if ($distConfig->dob_from) {
                $query->where('dob', '>=', $distConfig->dob_from);
            }
            if ($distConfig->dob_to) {
                $query->where('dob', '<=', $distConfig->dob_to);
            }
        }

        // Apply same-city duty restrictions from district config
        if ($distConfig && !empty($cityId)) {
            $sameCityMaleAllowed = $distConfig->same_city_duty_male ?? true;
            $sameCityFemaleAllowed = $distConfig->same_city_duty_female ?? true;

            if (!$sameCityMaleAllowed || !$sameCityFemaleAllowed) {
                $query->where(function ($q) use ($cityId, $sameCityMaleAllowed, $sameCityFemaleAllowed) {
                    if (!$sameCityMaleAllowed) {
                        $q->where(function ($sub) use ($cityId) {
                            $sub->where('gender', '<>', 1)
                                ->orWhere('city_id', '<>', $cityId);
                        });
                    }
                    if (!$sameCityFemaleAllowed) {
                        $q->where(function ($sub) use ($cityId) {
                            $sub->where('gender', '<>', 2)
                                ->orWhere('city_id', '<>', $cityId);
                        });
                    }
                });
            }
        }

        // 2. Filter by salary rules if post_name is provided
        if (!empty($postName)) {
            \App\Support\SalaryComparison::applyRangeFilter($query, $postName, $districtId, $cityType ?: 'urban');
        }

        if ($term !== '') {
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('emp_code', 'like', "%{$term}%");
            });
        }

        $employees = $query->with('designation:id,designation')
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'emp_code', 'designation_id']);

        return response()->json($employees);
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

        if (in_array($type, ['emp-types', 'designations', 'departments', 'pay-levels'], true)) {
            return;
        }

        if ($type === 'countries') {
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

        if (in_array($type, ['districts', 'np-cities', 'np-wards', 'np-polling-stations', 'rp-cities', 'rp-wards', 'rp-polling-stations', 'employees'], true)) {
            if ($access['district_ids']) {
                $type === 'districts'
                    ? $query->whereIn('id', $access['district_ids'])
                    : $query->whereIn('district_id', $access['district_ids']);
                return;
            } elseif ($access['state_ids']) {
                $query->whereIn('state_id', $access['state_ids']);
                return;
            } elseif ($access['country_ids']) {
                if ($type === 'districts') {
                    $query->whereIn('country_id', $access['country_ids']);
                    return;
                }

                $stateIds = MasterState::query()->whereIn('country_id', $access['country_ids'])->pluck('id');
                $query->whereIn('state_id', $stateIds);
                return;
            }
        }

        if (in_array($type, ['offices', 'employees'], true)) {
            if ($access['office_ids']) {
                $query->whereIn('ofc_id', $access['office_ids']);
                return;
            } elseif ($access['district_ids']) {
                $query->whereIn('district_id', $access['district_ids']);
                return;
            } elseif ($access['state_ids']) {
                $query->whereIn('state_id', $access['state_ids']);
                return;
            }
        }

        $query->whereRaw('1 = 0');
    }

    private function validated(Request $request, string $type, ?Model $row = null): array
    {
        if ($type === 'employees' && !$row) {
            $mergeData = [];

            if (!$request->has('ofc_id') || $request->input('ofc_id') === '') {
                $mergeData['ofc_id'] = $request->user()->ofc_id;
            }

            if (!$request->has('department_id') || $request->input('department_id') === '') {
                $userDept = $request->user()->department;
                if (!empty($userDept)) {
                    $deptId = \Illuminate\Support\Facades\DB::table('master_departments')
                        ->where('department', $userDept)
                        ->value('id');
                    if ($deptId) {
                        $mergeData['department_id'] = $deptId;
                    }
                }
            }

            if (!empty($mergeData)) {
                $request->merge($mergeData);
            }
        }

        $statusRule = ['nullable', 'integer', Rule::in([0, 1])];
        $fileRule = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'];

        $rules = match ($type) {
            'countries' => [
                'name' => ['required', 'string', 'max:100', $this->uniqueRule('master_countries', 'name', $row)],
                'status' => $statusRule,
                'attachment' => $fileRule,
            ],
            'states' => [
                'country_id' => ['required', 'integer', 'exists:master_countries,id'],
                'name' => ['required', 'string', 'max:100', $this->uniqueRule('master_states', 'name', $row)],
                'state_code' => ['nullable', 'string', 'max:10'],
                'status' => $statusRule,
                'attachment' => $fileRule,
            ],
            'districts' => [
                'country_id' => ['required', 'integer', 'exists:master_countries,id'],
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'name' => ['required', 'string', 'max:100', $this->uniqueRule('master_districts', 'name', $row)],
                'district_code' => ['nullable', 'string', 'max:10'],
                'status' => $statusRule,
                'attachment' => $fileRule,
            ],
            'offices' => [
                'office_code' => ['nullable', 'string', 'max:20', $this->uniqueRule('master_offices', 'office_code', $row, 'ofc_id')],
                'office_name' => ['required', 'string', 'max:100'],
                'company_name' => ['nullable', 'string', 'max:100'],
                'department_id' => ['required', 'integer', 'exists:master_departments,id'],
                'office_type' => ['nullable', 'integer', Rule::in([1, 2])],
                'ofc_parent_id' => ['nullable', 'integer'],
                'country_id' => ['required', 'integer', 'exists:master_countries,id'],
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'district_id' => ['required', 'integer', 'exists:master_districts,id'],
                'status' => $statusRule,
                'attachment' => $fileRule,
            ],
            'np-cities' => [
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'district_id' => ['required', 'integer', 'exists:master_districts,id'],
                'city_name' => ['required', 'string', 'max:150', $this->uniqueRule('master_np_cities', 'city_name', $row)],
                'karyalay_name' => ['required', 'string', 'max:100'],
                'status' => $statusRule,
            ],
            'rp-cities' => [
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'district_id' => ['required', 'integer', 'exists:master_districts,id'],
                'city_name' => ['required', 'string', 'max:150', $this->uniqueRule('master_rp_cities', 'city_name', $row)],
                'karyalay_name' => ['required', 'string', 'max:100'],
                'status' => $statusRule,
            ],
            'np-wards' => [
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'district_id' => ['required', 'integer', 'exists:master_districts,id'],
                'city_id' => ['required', 'integer', 'exists:master_np_cities,id'],
                'ward_no' => ['required', 'integer', 'min:1'],
                'ward_name' => ['required', 'string', 'max:150', $this->uniqueRule('master_np_wards', 'ward_name', $row)],
                'status' => $statusRule,
            ],
            'rp-wards' => [
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'district_id' => ['required', 'integer', 'exists:master_districts,id'],
                'city_id' => ['required', 'integer', 'exists:master_rp_cities,id'],
                'ward_no' => ['required', 'integer', 'min:1'],
                'ward_name' => ['required', 'string', 'max:150', $this->uniqueRule('master_rp_wards', 'ward_name', $row)],
                'status' => $statusRule,
            ],
            'np-polling-stations' => [
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'district_id' => ['required', 'integer', 'exists:master_districts,id'],
                'city_id' => ['required', 'integer', 'exists:master_np_cities,id'],
                'ward_id' => ['required', 'integer', 'exists:master_np_wards,id'],
                'polling_station_name' => ['required', 'string', 'max:150', $this->uniqueRule('master_np_polling_stations', 'polling_station_name', $row)],
                'status' => $statusRule,
            ],
            'rp-polling-stations' => [
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'district_id' => ['required', 'integer', 'exists:master_districts,id'],
                'city_id' => ['required', 'integer', 'exists:master_rp_cities,id'],
                'ward_id' => ['required', 'integer', 'exists:master_rp_wards,id'],
                'polling_station_name' => ['required', 'string', 'max:150', $this->uniqueRule('master_rp_polling_stations', 'polling_station_name', $row)],
                'status' => $statusRule,
            ],
            'emp-types' => [
                'emp_type' => ['required', 'string', 'max:50', $this->uniqueRule('master_emp_types', 'emp_type', $row)],
                'status' => $statusRule,
            ],
            'designations' => [
                'designation' => ['required', 'string', 'max:100', $this->uniqueRule('master_designations', 'designation', $row)],
                'status' => $statusRule,
            ],
            'departments' => [
                'department' => ['required', 'string', 'max:100', $this->uniqueRule('master_departments', 'department', $row)],
                'status' => $statusRule,
            ],
            'pay-levels' => [
                'level' => ['required', 'string', 'max:50', $this->uniqueRule('master_pay_levels', 'level', $row)],
                'min_amount_pay' => ['required', 'numeric', 'min:0'],
                'max_amount_pay' => ['required', 'numeric', 'min:0', 'gte:min_amount_pay'],
                'grade_pay' => ['required', 'string', 'max:50'],
                'status' => $statusRule,
            ],
            'employees' => [
                'emp_code' => ['nullable', 'string', 'max:30', $this->uniqueRule('master_employees', 'emp_code', $row)],
                'gov_emp_code' => ['nullable', 'string', 'max:50', $this->uniqueRule('master_employees', 'gov_emp_code', $row)],
                'title' => ['required', 'string', 'max:100'],
                'name' => ['required', 'string', 'max:100'],
                'gender' => ['required', 'integer', Rule::in([1, 2])],
                'dob' => [
                    'required',
                    'date',
                    function ($attribute, $value, $fail) use ($request) {
                        $districtId = $request->input('district_id');
                        if ($districtId) {
                            $config = \App\Models\DistrictElectionConfig::where('district_id', $districtId)->first();
                            if ($config) {
                                $dob = \Carbon\Carbon::parse($value);
                                if ($config->dob_from && $dob->lt($config->dob_from)) {
                                    $fail("The Employee's Date of Birth must be after " . $config->dob_from->format('Y-m-d') . " as per configuration for the selected District.");
                                }
                                if ($config->dob_to && $dob->gt($config->dob_to)) {
                                    $fail("The Employee's Date of Birth must be before " . $config->dob_to->format('Y-m-d') . " as per configuration for the selected District.");
                                }
                            }
                        }
                    }
                ],
                'mobile' => ['required', 'string', 'regex:/^[6-9][0-9]{9}$/', $this->uniqueRule('master_employees', 'mobile', $row)],
                'email' => ['required', 'email', 'max:100', $this->uniqueRule('master_employees', 'email', $row)],
                'emp_type_id' => ['required', 'integer', 'exists:master_emp_types,id'],
                'department_id' => ['required', 'integer', 'exists:master_departments,id'],
                'designation_id' => ['required', 'integer', 'exists:master_designations,id'],
                'ofc_id' => ['nullable', 'integer', 'exists:master_offices,ofc_id'],
                'pay_level_id' => ['required', 'integer', 'exists:master_pay_levels,id'],
                'basic_pay' => [
                    'required',
                    'numeric',
                    function ($attribute, $value, $fail) use ($request) {
                        $payLevelId = $request->input('pay_level_id');
                        if ($payLevelId) {
                            $payLevel = \Illuminate\Support\Facades\DB::table('master_pay_levels')
                                ->where('id', $payLevelId)
                                ->first(['min_amount_pay', 'max_amount_pay']);
                            if ($payLevel) {
                                $min = (float) $payLevel->min_amount_pay;
                                $max = (float) $payLevel->max_amount_pay;
                                $val = (float) $value;
                                if ($val < $min || $val > $max) {
                                    $fail("The Basic Pay must be between {$min} and {$max} for the selected Pay Level.");
                                }
                            }
                        }
                    }
                ],
                'country_id' => ['required', 'integer', 'exists:master_countries,id'],
                'state_id' => ['required', 'integer', 'exists:master_states,id'],
                'district_id' => ['required', 'integer', 'exists:master_districts,id'],
                'city_type' => ['required', 'string', Rule::in(['urban', 'rural'])],
                'city_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($request) {
                    $table = $request->input('city_type') === 'urban' ? 'master_np_cities' : 'master_rp_cities';
                    if (!\Illuminate\Support\Facades\DB::table($table)->where('id', $value)->exists()) {
                        $fail('The selected city_id is invalid.');
                    }
                }],
                'any_disability' => ['required', 'integer', Rule::in([0, 1])],
                'remark' => ['nullable', 'string', 'max:1000'],
                'status' => $statusRule,
            ],
        };

        $data = $request->validate($rules);
        unset($data['attachment']);

        $data['status'] = (int) ($data['status'] ?? 1);

        if ($type === 'offices') {
            $data['office_type'] = (int) ($data['office_type'] ?? 1);
            $data['ofc_parent_id'] = (int) ($data['ofc_parent_id'] ?? 0);
            $this->validateOfficeLocation($data);
        }

        if ($type === 'employees') {
            $this->validateOfficeLocation($data);

            if (!empty($data['emp_code'])) {
                $empCode = trim($data['emp_code']);
                if (preg_match('/^emp/i', $empCode)) {
                    $empCode = 'NIC' . substr($empCode, 3);
                } elseif (!preg_match('/^nic/i', $empCode)) {
                    $empCode = 'NIC' . $empCode;
                } else {
                    $empCode = 'NIC' . substr($empCode, 3);
                }
                $data['emp_code'] = $empCode;
            } else {
                $maxId = \Illuminate\Support\Facades\DB::table('master_employees')->max('id') ?? 0;
                $nextId = $maxId + 1;
                $data['emp_code'] = 'NIC' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
            }
        }

        if (in_array($type, ['np-cities', 'np-wards', 'np-polling-stations', 'rp-cities', 'rp-wards', 'rp-polling-stations', 'employees'], true)) {
            $this->validateLocalBodyLocation($data, $type);
        }

        return $data;
    }

    private function validateLocalBodyLocation(array $data, string $type): void
    {
        $districtValid = MasterDistrict::query()
            ->whereKey($data['district_id'])
            ->where('state_id', $data['state_id'])
            ->exists();

        if (! $districtValid) {
            throw ValidationException::withMessages([
                'district_id' => 'Selected District does not belong to the chosen State.',
            ]);
        }

        if (in_array($type, ['np-wards', 'np-polling-stations', 'rp-wards', 'rp-polling-stations', 'employees'], true)) {
            $cityModel = MasterNPCity::class;
            if ($type === 'rp-wards' || $type === 'rp-polling-stations') {
                $cityModel = MasterRPCity::class;
            } elseif ($type === 'employees') {
                $cityModel = $data['city_type'] === 'urban' ? MasterNPCity::class : MasterRPCity::class;
            }

            $cityValid = $cityModel::query()
                ->whereKey($data['city_id'])
                ->where('state_id', $data['state_id'])
                ->where('district_id', $data['district_id'])
                ->exists();

            if (! $cityValid) {
                throw ValidationException::withMessages([
                    'city_id' => 'Selected City does not belong to the chosen District.',
                ]);
            }
        }

        if ($type === 'np-polling-stations' || $type === 'rp-polling-stations') {
            $wardModel = $type === 'np-polling-stations' ? MasterNPWard::class : MasterRPWard::class;
            $wardValid = $wardModel::query()
                ->whereKey($data['ward_id'])
                ->where('state_id', $data['state_id'])
                ->where('district_id', $data['district_id'])
                ->where('city_id', $data['city_id'])
                ->exists();

            if (! $wardValid) {
                throw ValidationException::withMessages([
                    'ward_id' => 'Selected Ward does not belong to the chosen City.',
                ]);
            }
        }
    }

    private function importFields(string $type): array
    {
        return match ($type) {
            'np-cities', 'rp-cities' => [
                'state_id' => 'State ID',
                'district_id' => 'District ID',
                'city_name' => 'City Name',
                'karyalay_name' => 'Karyalay Name',
                'status' => 'Status',
            ],
            'employees' => [
                'emp_code' => 'NIC Code',
                'gov_emp_code' => 'Govt Employee Code',
                'title' => 'Title',
                'name' => 'Name',
                'gender' => 'Gender',
                'dob' => 'Date of Birth',
                'mobile' => 'Mobile',
                'email' => 'Email',
                'emp_type_id' => 'Employee Type ID',
                'department_id' => 'Department ID',
                'designation_id' => 'Designation ID',
                'ofc_id' => 'Office ID',
                'pay_level_id' => 'Pay Level ID',
                'basic_pay' => 'Basic Pay',
                'country_id' => 'Country ID',
                'state_id' => 'State ID',
                'district_id' => 'District ID',
                'city_type' => 'City Type',
                'city_id' => 'City ID',
                'any_disability' => 'Any Disability',
                'remark' => 'Remark',
                'status' => 'Status',
            ],
        };
    }

    private function headerMap(array $headers, array $fields): array
    {
        $aliases = [];
        foreach ($fields as $key => $label) {
            $aliases[$this->normalizeHeader($key)] = $key;
            $aliases[$this->normalizeHeader($label)] = $key;
        }

        $map = [];
        foreach ($headers as $index => $header) {
            $normalized = $this->normalizeHeader((string) $header);
            if (isset($aliases[$normalized])) {
                $map[$index] = $aliases[$normalized];
            }
        }

        if (! $map) {
            throw ValidationException::withMessages(['file' => 'No recognizable columns were found in the CSV.']);
        }

        return $map;
    }

    private function normalizeHeader(string $value): string
    {
        return preg_replace('/[^a-z0-9]+/', '', strtolower($value)) ?: '';
    }

    private function normalizeImportRow(array $data, string $type): array
    {
        if (isset($data['status'])) {
            $status = strtolower((string) $data['status']);
            $data['status'] = in_array($status, ['inactive', '0', 'false', 'no'], true) ? 0 : 1;
        }

        if ($type === 'employees') {
            if (isset($data['gender']) && ! is_numeric($data['gender'])) {
                $data['gender'] = str_starts_with(strtolower($data['gender']), 'f') ? 2 : 1;
            }

            if (isset($data['any_disability']) && ! is_numeric($data['any_disability'])) {
                $data['any_disability'] = in_array(strtolower($data['any_disability']), ['yes', 'true', 'y'], true) ? 1 : 0;
            }

            if (isset($data['city_type'])) {
                $value = strtolower($data['city_type']);
                $data['city_type'] = in_array($value, ['rural', 'rp', 'nagari', 'nagari nikay'], true) ? 'rural' : 'urban';
            }
        }

        return $data;
    }

    private function validateOfficeLocation(array $data): void
    {
        $stateValid = MasterState::query()
            ->whereKey($data['state_id'])
            ->where('country_id', $data['country_id'])
            ->exists();

        if (! $stateValid) {
            throw ValidationException::withMessages([
                'state_id' => 'Selected State does not belong to the chosen Country.',
            ]);
        }

        $districtValid = MasterDistrict::query()
            ->whereKey($data['district_id'])
            ->where('country_id', $data['country_id'])
            ->where('state_id', $data['state_id'])
            ->exists();

        if (! $districtValid) {
            throw ValidationException::withMessages([
                'district_id' => 'Selected District does not belong to the chosen State.',
            ]);
        }
    }

    private function uniqueRule(string $table, string $column, ?Model $row, string $primaryKey = 'id'): mixed
    {
        $rule = Rule::unique($table, $column);

        return $row ? $rule->ignore($row->getKey(), $primaryKey) : $rule;
    }

    private function storeFile(Request $request, array $config, array $data, ?Model $row = null): array
    {
        if (empty($config['file_dir']) || ! $request->hasFile('attachment')) {
            return $data;
        }

        if ($row?->getAttribute('attachment_path')) {
            $this->deleteUploadedFile($row->getAttribute('attachment_path'));
        }

        $data['attachment_path'] = $request->file('attachment')->store($config['file_dir'], 'uploads');

        return $data;
    }

    private function deleteUploadedFile(?string $path): void
    {
        if (! $path) {
            return;
        }

        Storage::disk('uploads')->delete($this->normalizeUploadPath($path));
        Storage::disk('public')->delete(str_replace('storage/', '', $path));
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
        $data['attachment_url'] = $path ? $this->uploadedUrl($path) : null;

        if (array_key_exists('country_id', $data)) {
            $data['country_name'] = MasterCountry::query()->whereKey($data['country_id'])->value('name');
        }

        if (array_key_exists('state_id', $data)) {
            $data['state_name'] = MasterState::query()->whereKey($data['state_id'])->value('name');
        }

        if (array_key_exists('district_id', $data)) {
            $data['district_name'] = MasterDistrict::query()->whereKey($data['district_id'])->value('name');
        }

        if (array_key_exists('city_id', $data)) {
            $cityTable = 'master_np_cities';
            if ($row instanceof MasterRPCity || $row instanceof MasterRPWard || $row instanceof MasterRPPollingStation) {
                $cityTable = 'master_rp_cities';
            } elseif ($row instanceof MasterEmployee) {
                $cityTable = $row->city_type === 'urban' ? 'master_np_cities' : 'master_rp_cities';
            }
            $data['city_name_label'] = \Illuminate\Support\Facades\DB::table($cityTable)->where('id', $data['city_id'])->value('city_name');
        }

        if (array_key_exists('ward_id', $data)) {
            $wardTable = 'master_np_wards';
            if ($row instanceof MasterRPWard || $row instanceof MasterRPPollingStation) {
                $wardTable = 'master_rp_wards';
            }
            $ward = \Illuminate\Support\Facades\DB::table($wardTable)->where('id', $data['ward_id'])->first(['ward_no', 'ward_name']);
            $data['ward_name_label'] = $ward ? trim($ward->ward_no.' - '.$ward->ward_name) : null;
        }

        if (array_key_exists('emp_type_id', $data)) {
            $data['emp_type_name'] = MasterEmpType::query()->whereKey($data['emp_type_id'])->value('emp_type');
        }

        if (array_key_exists('department_id', $data)) {
            $data['department_name'] = MasterDepartment::query()->whereKey($data['department_id'])->value('department');
        }

        if (array_key_exists('designation_id', $data)) {
            $data['designation_name'] = MasterDesignation::query()->whereKey($data['designation_id'])->value('designation');
        }

        if (array_key_exists('pay_level_id', $data)) {
            $payLevel = MasterPayLevel::query()->whereKey($data['pay_level_id'])->first(['id', 'level', 'min_amount_pay', 'max_amount_pay', 'grade_pay']);
            $data['pay_level_name'] = $payLevel ? trim($payLevel->level.' - ('.$payLevel->min_amount_pay.' - '.$payLevel->max_amount_pay.')') : null;
            $data['grade_pay'] = $payLevel?->grade_pay;
        }

        if (array_key_exists('ofc_id', $data)) {
            $data['office_name'] = MasterOffice::query()->where('ofc_id', $data['ofc_id'])->value('office_name');
        }

        return $data;
    }

    private function uploadedUrl(string $path): string
    {
        return Storage::disk('uploads')->url($this->normalizeUploadPath($path));
    }

    private function frontendUrl(string $type, string $term): string
    {
        $base = $type === 'employees'
            ? '/admin/hrms/master-employee'
            : "/admin/masters/{$type}";

        return $base.'?search='.urlencode($term);
    }

    private function normalizeUploadPath(string $path): string
    {
        if (str_contains($path, '/storage/')) {
            $path = substr($path, strpos($path, '/storage/') + strlen('/storage/'));
        }

        return ltrim(str_replace(['/storage/', 'storage/'], '', $path), '/');
    }
}
