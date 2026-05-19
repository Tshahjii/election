<?php

namespace Database\Seeders;

use App\Support\AccessScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminId = $this->saveUser([
            'user_code' => 'USR-1001',
            'name' => 'Super Admin',
            'email' => 'tinkukumarshah48@gmail.com',
            'mobile' => '9343326066',
            'designation' => 'Super Admin',
            'role' => 1,
            'created_by' => null,
            'updated_by' => null,
        ]);

        $masterIds = $this->ensureMasterData($superAdminId);
        $this->saveUser([
            'user_code' => 'USR-1001',
            'name' => 'Super Admin',
            'email' => 'tinkukumarshah48@gmail.com',
            'mobile' => '9343326066',
            'designation' => 'Super Admin',
            'role' => 1,
            'ofc_id' => $masterIds['ceo_office_id'],
            'created_by' => null,
            'updated_by' => $superAdminId,
        ]);

        $adminId = $this->saveUser([
            'user_code' => 'USR-2001',
            'name' => 'Raipur Admin',
            'email' => 'admin.raipur@example.com',
            'mobile' => '9343326001',
            'designation' => 'District Admin',
            'role' => 2,
            'ofc_id' => $masterIds['raipur_office_id'],
            'ofc_code' => 'DEO-RP',
            'created_by' => $superAdminId,
            'updated_by' => $superAdminId,
        ]);

        $dataEntryId = $this->saveUser([
            'user_code' => 'USR-3001',
            'name' => 'Data Entry User',
            'email' => 'data.entry@example.com',
            'mobile' => '9343326002',
            'designation' => 'Data Entry Operator',
            'role' => 3,
            'ofc_id' => $masterIds['raipur_office_id'],
            'ofc_code' => 'DEO-RP',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        $verifierId = $this->saveUser([
            'user_code' => 'USR-4001',
            'name' => 'Verifier User',
            'email' => 'verifier@example.com',
            'mobile' => '9343326003',
            'designation' => 'Verifier',
            'role' => 4,
            'ofc_id' => $masterIds['raipur_office_id'],
            'ofc_code' => 'DEO-RP',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        $reportViewerId = $this->saveUser([
            'user_code' => 'USR-6001',
            'name' => 'Report Viewer',
            'email' => 'report.viewer@example.com',
            'mobile' => '9343326004',
            'designation' => 'Report Viewer',
            'role' => 6,
            'ofc_id' => $masterIds['durg_office_id'],
            'ofc_code' => 'DEO-DG',
            'district' => 'Durg',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);

        $this->saveAccess($superAdminId, AccessScope::fullPermissions(), [], $superAdminId);

        $adminAccess = [
            'country_ids' => [$masterIds['country_id']],
            'state_ids' => [$masterIds['state_id']],
            'district_ids' => [$masterIds['raipur_district_id'], $masterIds['durg_district_id']],
            'office_ids' => [$masterIds['ceo_office_id'], $masterIds['raipur_office_id'], $masterIds['durg_office_id']],
        ];

        $this->saveAccess($adminId, $this->adminPermissions(), $adminAccess, $superAdminId);
        $this->saveAccess($dataEntryId, $this->dataEntryPermissions(), [
            'country_ids' => [$masterIds['country_id']],
            'state_ids' => [$masterIds['state_id']],
            'district_ids' => [$masterIds['raipur_district_id']],
            'office_ids' => [$masterIds['raipur_office_id']],
        ], $adminId);
        $this->saveAccess($verifierId, $this->verifierPermissions(), [
            'country_ids' => [$masterIds['country_id']],
            'state_ids' => [$masterIds['state_id']],
            'district_ids' => [$masterIds['raipur_district_id']],
            'office_ids' => [$masterIds['raipur_office_id']],
        ], $adminId);
        $this->saveAccess($reportViewerId, $this->reportViewerPermissions(), [
            'country_ids' => [$masterIds['country_id']],
            'state_ids' => [$masterIds['state_id']],
            'district_ids' => [$masterIds['durg_district_id']],
            'office_ids' => [$masterIds['durg_office_id']],
        ], $adminId);
    }

    private function ensureMasterData(int $actorId): array
    {
        DB::table('master_countries')->updateOrInsert(
            ['iso2' => 'IN'],
            [
                'name' => 'India',
                'iso3' => 'IND',
                'phone_code' => '+91',
                'currency' => 'INR',
                'currency_symbol' => 'Rs',
                'nationality' => 'Indian',
                'status' => 1,
                'created_by' => $actorId,
                'updated_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $countryId = (int) DB::table('master_countries')->where('iso2', 'IN')->value('id');

        DB::table('master_states')->updateOrInsert(
            ['country_id' => $countryId, 'state_code' => 'CG'],
            [
                'name' => 'Chhattisgarh',
                'status' => 1,
                'created_by' => $actorId,
                'updated_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $stateId = (int) DB::table('master_states')->where('country_id', $countryId)->where('state_code', 'CG')->value('id');

        DB::table('master_districts')->updateOrInsert(
            ['country_id' => $countryId, 'state_id' => $stateId, 'district_code' => 'RP'],
            [
                'name' => 'Raipur',
                'status' => 1,
                'created_by' => $actorId,
                'updated_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        DB::table('master_districts')->updateOrInsert(
            ['country_id' => $countryId, 'state_id' => $stateId, 'district_code' => 'DG'],
            [
                'name' => 'Durg',
                'status' => 1,
                'created_by' => $actorId,
                'updated_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $raipurDistrictId = (int) DB::table('master_districts')->where('state_id', $stateId)->where('district_code', 'RP')->value('id');
        $durgDistrictId = (int) DB::table('master_districts')->where('state_id', $stateId)->where('district_code', 'DG')->value('id');

        DB::table('master_offices')->updateOrInsert(
            ['office_code' => 'CEO-CG'],
            [
                'office_name' => 'Chief Electoral Office',
                'company_name' => 'Election Department',
                'office_type' => 1,
                'ofc_parent_id' => 0,
                'status' => 1,
                'district' => 'Raipur',
                'state' => 'Chhattisgarh',
                'country' => 'India',
                'created_by' => $actorId,
                'updated_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $ceoOfficeId = (int) DB::table('master_offices')->where('office_code', 'CEO-CG')->value('ofc_id');

        DB::table('master_offices')->updateOrInsert(
            ['office_code' => 'DEO-RP'],
            [
                'office_name' => 'District Election Office Raipur',
                'company_name' => 'Election Department',
                'office_type' => 2,
                'ofc_parent_id' => $ceoOfficeId,
                'status' => 1,
                'district' => 'Raipur',
                'state' => 'Chhattisgarh',
                'country' => 'India',
                'created_by' => $actorId,
                'updated_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        DB::table('master_offices')->updateOrInsert(
            ['office_code' => 'DEO-DG'],
            [
                'office_name' => 'District Election Office Durg',
                'company_name' => 'Election Department',
                'office_type' => 2,
                'ofc_parent_id' => $ceoOfficeId,
                'status' => 1,
                'district' => 'Durg',
                'state' => 'Chhattisgarh',
                'country' => 'India',
                'created_by' => $actorId,
                'updated_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        return [
            'country_id' => $countryId,
            'state_id' => $stateId,
            'raipur_district_id' => $raipurDistrictId,
            'durg_district_id' => $durgDistrictId,
            'ceo_office_id' => $ceoOfficeId,
            'raipur_office_id' => (int) DB::table('master_offices')->where('office_code', 'DEO-RP')->value('ofc_id'),
            'durg_office_id' => (int) DB::table('master_offices')->where('office_code', 'DEO-DG')->value('ofc_id'),
        ];
    }

    private function saveUser(array $data): int
    {
        $payload = array_merge([
            'user_code' => null,
            'name' => null,
            'mobile' => null,
            'user_verified_at' => now(),
            'password' => Hash::make('Admin@123'),
            'password_changed_at' => null,
            'emp_type' => 'Permanent',
            'department' => 'Election Office',
            'ofc_id' => 1,
            'ofc_code' => 'CEO-CG',
            'district' => 'Raipur',
            'state' => 'Chhattisgarh',
            'country' => 'India',
            'address' => 'Raipur, Chhattisgarh',
            'is_active' => 1,
            'last_active' => now(),
            'last_active_ip' => '127.0.0.1',
            'remember_token' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ], $data);

        DB::table('users')->updateOrInsert(
            ['email' => $payload['email']],
            $payload
        );

        return (int) DB::table('users')->where('email', $payload['email'])->value('id');
    }

    private function saveAccess(int $userId, array $permissions, array $access, int $actorId): void
    {
        $user = DB::table('users')->where('id', $userId)->first();
        $normalizedPermissions = AccessScope::normalizePermissions($permissions);

        DB::table('access_managments')->updateOrInsert(
            ['user_id' => $userId],
            [
                'emp_type' => $user->emp_type ?? 'Permanent',
                'department' => $user->department ?? 'Election Office',
                'designation' => $user->designation ?? null,
                'ofc_id' => $user->ofc_id ?? null,
                'ofc_code' => $user->ofc_code ?? null,
                'district' => $user->district ?? 'Raipur',
                'state' => $user->state ?? 'Chhattisgarh',
                'country' => $user->country ?? 'India',
                'country_ids' => $this->csv($access['country_ids'] ?? []),
                'state_ids' => $this->csv($access['state_ids'] ?? []),
                'district_ids' => $this->csv($access['district_ids'] ?? []),
                'office_ids' => $this->csv($access['office_ids'] ?? []),
                'permissions' => json_encode($normalizedPermissions),
                'can_create' => $this->hasAnyPermission($normalizedPermissions, 'create') ? 1 : 0,
                'can_edit' => $this->hasAnyPermission($normalizedPermissions, 'edit') ? 1 : 0,
                'can_delete' => $this->hasAnyPermission($normalizedPermissions, 'delete') ? 1 : 0,
                'created_by' => $actorId,
                'updated_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    private function adminPermissions(): array
    {
        $permissions = $this->readOnlyPermissions();

        foreach (['masters.states', 'masters.districts', 'masters.offices', 'users.access'] as $module) {
            foreach (AccessScope::ACTIONS as $action) {
                $permissions[$module][$action] = true;
            }
        }

        return $permissions;
    }

    private function dataEntryPermissions(): array
    {
        $permissions = $this->readOnlyPermissions(['dashboard.overview', 'masters.states', 'masters.districts']);
        $permissions['masters.districts']['create'] = true;

        return $permissions;
    }

    private function verifierPermissions(): array
    {
        return $this->readOnlyPermissions(['dashboard.overview', 'masters.states', 'masters.districts', 'voters.verification']);
    }

    private function reportViewerPermissions(): array
    {
        return $this->readOnlyPermissions(['dashboard.overview', 'reports.election', 'reports.audit']);
    }

    private function readOnlyPermissions(?array $modules = null): array
    {
        $permissions = AccessScope::normalizePermissions([]);
        $modules ??= array_keys(AccessScope::MODULES);

        foreach ($modules as $module) {
            $permissions[$module]['read'] = true;
        }

        return $permissions;
    }

    private function csv(array $ids): ?string
    {
        $value = collect($ids)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->implode(',');

        return $value === '' ? null : $value;
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
