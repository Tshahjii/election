<?php

namespace App\Http\Controllers;

use App\Models\AccessManagment;
use App\Models\MasterCountry;
use App\Models\MasterDistrict;
use App\Models\MasterOffice;
use App\Models\MasterState;
use App\Models\User;
use App\Support\AccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserAccessController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('accessManagment');
        $actor = $request->user();

        if ((int) $actor->role === 2) {
            $query->where('created_by', $actor->id)->whereKeyNot($actor->id);
        } elseif ((int) $actor->role !== 1) {
            $query->where('created_by', $actor->id);
        }

        foreach (['name', 'mobile', 'user_code'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, 'like', '%'.$request->query($field).'%');
            }
        }

        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->query('status') === 'Active' ? 1 : 0);
        }

        return response()->json(
            $query->latest('id')
                ->paginate((int) $request->query('per_page', 10))
                ->through(fn (User $user) => $this->payload($user))
        );
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(AccessScope::can($request->user(), 'users.access', 'create'), 403, 'You do not have create permission.');

        $data = $this->validated($request);
        abort_unless((int) $request->user()->role === 1 || ! in_array((int) $data['role'], [1, 2], true), 403, 'Only System Admin can create admin users.');

        $user = DB::transaction(function () use ($data, $request) {
            $user = User::query()->create($this->userData($data));
            $this->saveBaseAccess($user, $data, $request->user());

            return $user->fresh('accessManagment');
        });

        return response()->json([
            'message' => 'User created successfully.',
            'data' => $this->payload($user),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_unless(AccessScope::can($request->user(), 'users.access', 'edit'), 403, 'You do not have edit permission.');
        abort_unless($this->canTouchUser($request->user(), $user), 403, 'You cannot update this user.');

        $data = $this->validated($request, $user);
        abort_unless((int) $request->user()->role === 1 || ! in_array((int) $data['role'], [1, 2], true), 403, 'Only System Admin can update admin users.');

        DB::transaction(function () use ($data, $user, $request) {
            $user->fill($this->userData($data, $user))->save();
            $this->saveBaseAccess($user, $data, $request->user());
        });

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $this->payload($user->fresh('accessManagment')),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless(AccessScope::can($request->user(), 'users.access', 'delete'), 403, 'You do not have delete permission.');
        abort_unless($this->canTouchUser($request->user(), $user), 403, 'You cannot delete this user.');

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function accessOptions(Request $request): JsonResponse
    {
        $countries = MasterCountry::query()->where('status', 1);
        $states = MasterState::query()->where('status', 1);
        $districts = MasterDistrict::query()->where('status', 1);
        $offices = MasterOffice::query()->where('status', 1);
        $access = AccessScope::payload($request->user());

        if (! $access['is_super_admin']) {
            if ($access['country_ids']) {
                $countries->whereIn('id', $access['country_ids']);
                $states->whereIn('country_id', $access['country_ids']);
                $districts->whereIn('country_id', $access['country_ids']);
            }

            if ($access['state_ids']) {
                $states->whereIn('id', $access['state_ids']);
                $districts->whereIn('state_id', $access['state_ids']);
            }

            if ($access['district_ids']) {
                $districts->whereIn('id', $access['district_ids']);
                $districtNames = MasterDistrict::query()->whereIn('id', $access['district_ids'])->pluck('name');
                $offices->whereIn('district', $districtNames);
            } elseif ($access['state_ids']) {
                $stateNames = MasterState::query()->whereIn('id', $access['state_ids'])->pluck('name');
                $offices->whereIn('state', $stateNames);
            }

            if ($access['office_ids']) {
                $offices->whereIn('ofc_id', $access['office_ids']);
            }

            if (! $access['country_ids'] && ! $access['state_ids'] && ! $access['district_ids'] && ! $access['office_ids']) {
                $countries->whereRaw('1 = 0');
                $states->whereRaw('1 = 0');
                $districts->whereRaw('1 = 0');
                $offices->whereRaw('1 = 0');
            }
        }

        return response()->json([
            'countries' => $countries->orderBy('name')->get(['id', 'name']),
            'states' => $states->orderBy('name')->get(['id', 'country_id', 'name']),
            'districts' => $districts->orderBy('name')->get(['id', 'country_id', 'state_id', 'name']),
            'offices' => $offices->orderBy('office_name')->get(['ofc_id', 'office_name', 'office_code', 'district', 'state', 'country']),
            'modules' => collect(AccessScope::MODULES)->map(fn (string $label, string $key) => ['key' => $key, 'label' => $label])->values(),
            'actions' => AccessScope::ACTIONS,
        ]);
    }

    public function updateAccess(Request $request, User $user): JsonResponse
    {
        abort_unless(AccessScope::can($request->user(), 'users.access', 'edit'), 403, 'You do not have access permission.');
        abort_unless($this->canTouchUser($request->user(), $user), 403, 'You cannot assign access to this user.');

        if ((int) $user->role === 2 && (int) $request->user()->role !== 1) {
            abort(403, 'Only System Admin can assign access to Admin users.');
        }

        $data = $this->validatedAccess($request, $user);

        $this->saveAccess($user, $data, $request->user());

        return response()->json([
            'message' => 'Access updated successfully.',
            'data' => $this->payload($user->fresh('accessManagment')),
        ]);
    }

    private function validated(Request $request, ?User $user = null): array
    {
        $data = $request->validate([
            'user_code' => ['nullable', 'string', 'max:30', Rule::unique('users', 'user_code')->ignore($user?->id)],
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', Rule::unique('users', 'email')->ignore($user?->id)],
            'mobile' => ['required', 'string', 'regex:/^[6-9][0-9]{9}$/', Rule::unique('users', 'mobile')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
            'emp_type' => ['required', 'string', 'max:50'],
            'department' => ['required', 'string', 'max:100'],
            'designation' => ['required', 'string', 'max:100'],
            'ofc_id' => ['nullable', 'integer'],
            'ofc_code' => ['nullable', 'string', 'max:20'],
            'district' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'role' => ['required', 'integer', Rule::in([1, 2, 3, 4, 5, 6])],
            'is_active' => ['required', 'integer', Rule::in([0, 1])],
        ]);
    }

    private function validatedAccess(Request $request, User $user): array
    {
        $data = $request->validate([
            'country_ids' => ['nullable', 'array'],
            'country_ids.*' => ['integer', 'exists:master_countries,id'],
            'state_ids' => ['nullable', 'array'],
            'state_ids.*' => ['integer', 'exists:master_states,id'],
            'district_ids' => ['nullable', 'array'],
            'district_ids.*' => ['integer', 'exists:master_districts,id'],
            'office_ids' => ['nullable', 'array'],
            'office_ids.*' => ['integer', 'exists:master_offices,ofc_id'],
            'permissions' => ['nullable', 'array'],
        ]);

        $data['role'] = $user->role;

        $this->validateHierarchy($data);

        return $data;
    }

    private function validateHierarchy(array $data): void
    {
        if ((int) ($data['role'] ?? 0) === 1) {
            return;
        }

        $countryIds = collect($data['country_ids'] ?? [])->map(fn ($id) => (int) $id)->all();
        $stateIds = collect($data['state_ids'] ?? [])->map(fn ($id) => (int) $id)->all();
        $districtIds = collect($data['district_ids'] ?? [])->map(fn ($id) => (int) $id)->all();

        if ($stateIds && ! $countryIds) {
            throw ValidationException::withMessages([
                'state_ids' => 'Please select the related Country first.',
            ]);
        }

        if ($districtIds && ! $stateIds) {
            throw ValidationException::withMessages([
                'district_ids' => 'Please select the related State first.',
            ]);
        }

        if ($stateIds) {
            $invalidStateExists = MasterState::query()
                ->whereIn('id', $stateIds)
                ->whereNotIn('country_id', $countryIds)
                ->exists();

            if ($invalidStateExists) {
                throw ValidationException::withMessages([
                    'state_ids' => 'Selected State does not belong to the chosen Country. Please select the correct hierarchy.',
                ]);
            }
        }

        if ($districtIds) {
            $invalidDistrictExists = MasterDistrict::query()
                ->whereIn('id', $districtIds)
                ->whereNotIn('state_id', $stateIds)
                ->exists();

            if ($invalidDistrictExists) {
                throw ValidationException::withMessages([
                    'district_ids' => 'Selected District does not belong to the chosen State. Please select the correct hierarchy.',
                ]);
            }
        }
    }

    private function userData(array $data, ?User $user = null): array
    {
        $payload = collect($data)->only([
            'user_code',
            'name',
            'email',
            'mobile',
            'emp_type',
            'department',
            'designation',
            'ofc_id',
            'ofc_code',
            'district',
            'state',
            'country',
            'address',
            'role',
            'is_active',
        ])->all();

        if (! $user) {
            $payload['user_verified_at'] = now();
            $payload['created_by'] = request()->user()?->id;
        }

        $payload['updated_by'] = request()->user()?->id;

        if (! empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
            $payload['password_changed_at'] = null;
        }

        return $payload;
    }

    private function saveBaseAccess(User $user, array $data, ?User $actor): void
    {
        AccessManagment::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'emp_type' => $data['emp_type'],
                'department' => $data['department'],
                'designation' => $data['designation'] ?? null,
                'ofc_id' => $data['ofc_id'] ?? null,
                'ofc_code' => $data['ofc_code'] ?? null,
                'district' => $data['district'],
                'state' => $data['state'],
                'country' => $data['country'],
                'created_by' => $actor?->id,
                'updated_by' => $actor?->id,
            ]
        );
    }

    private function saveAccess(User $user, array $data, ?User $actor): void
    {
        $isSuperAdmin = (int) $user->role === 1;
        $permissions = $isSuperAdmin ? AccessScope::fullPermissions() : AccessScope::normalizePermissions($data['permissions'] ?? []);

        AccessManagment::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'emp_type' => $user->emp_type,
                'department' => $user->department,
                'designation' => $user->designation,
                'ofc_id' => $user->ofc_id,
                'ofc_code' => $user->ofc_code,
                'district' => $user->district,
                'state' => $user->state,
                'country' => $user->country,
                'country_ids' => $isSuperAdmin ? null : AccessScope::csv($data['country_ids'] ?? []),
                'state_ids' => $isSuperAdmin ? null : AccessScope::csv($data['state_ids'] ?? []),
                'district_ids' => $isSuperAdmin ? null : AccessScope::csv($data['district_ids'] ?? []),
                'office_ids' => $isSuperAdmin ? null : AccessScope::csv($data['office_ids'] ?? []),
                'permissions' => $permissions,
                'can_create' => $isSuperAdmin || $this->hasAnyPermission($permissions, 'create'),
                'can_edit' => $isSuperAdmin || $this->hasAnyPermission($permissions, 'edit'),
                'can_delete' => $isSuperAdmin || $this->hasAnyPermission($permissions, 'delete'),
                'updated_by' => $actor?->id,
            ]
        );
    }

    private function payload(User $user): array
    {
        $data = $user->toArray();
        $access = $user->accessManagment;

        $data['access'] = AccessScope::payload($user);
        $data['access_raw'] = [
            'country_ids' => AccessScope::ids($access?->country_ids),
            'state_ids' => AccessScope::ids($access?->state_ids),
            'district_ids' => AccessScope::ids($access?->district_ids),
            'office_ids' => AccessScope::ids($access?->office_ids),
            'permissions' => AccessScope::normalizePermissions($access?->permissions ?? []),
        ];

        return $data;
    }

    private function canTouchUser(User $actor, User $user): bool
    {
        if ((int) $actor->role === 1) {
            return true;
        }

        return (int) $actor->role === 2 && (int) $user->created_by === (int) $actor->id && (int) $user->id !== (int) $actor->id;
    }

    private function hasAnyPermission(array $permissions, string $action): bool
    {
        foreach ($permissions as $modulePermissions) {
            if (! empty($modulePermissions[$action])) {
                return true;
            }
        }

        return false;
    }
}
