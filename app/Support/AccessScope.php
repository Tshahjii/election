<?php

namespace App\Support;

use App\Models\User;

class AccessScope
{
    public const MODULES = [
        'dashboard.overview' => 'Dashboard Overview',
        'voters.list' => 'Voter List',
        'voters.verification' => 'Verification Queue',
        'voters.claims' => 'Claims & Objections',
        'masters.countries' => 'Master Country',
        'masters.states' => 'Master State',
        'masters.districts' => 'Master District',
        'masters.offices' => 'Master Office',
        'masters.cities' => 'Master City',
        'masters.wards' => 'Master Ward',
        'masters.polling_stations' => 'Master Polling Station',
        'hrms.emp_types' => 'HRMS Employee Type',
        'hrms.designations' => 'HRMS Designation',
        'hrms.departments' => 'HRMS Department',
        'hrms.pay_levels' => 'HRMS Pay Level',
        'hrms.employees' => 'HRMS Employee',
        'users.access' => 'Access Management',
        'polling.booth_map' => 'Booth Mapping',
        'polling.stations' => 'Polling Stations',
        'polling.turnout' => 'Turnout Monitor',
        'reports.election' => 'Election Reports',
        'reports.audit' => 'Audit Log',
        'calendar.reminders' => 'Calendar Reminders',
    ];

    public const ACTIONS = ['read', 'create', 'edit', 'delete'];

    public static function payload(User $user): array
    {
        $access = $user->accessManagment;
        $isSuperAdmin = (int) $user->role === 1;
        $permissions = $isSuperAdmin ? self::fullPermissions() : self::normalizePermissions($access?->permissions ?? []);

        return [
            'is_super_admin' => $isSuperAdmin,
            'permissions' => $permissions,
            'can_create' => $isSuperAdmin || self::hasAny($permissions, 'create'),
            'can_edit' => $isSuperAdmin || self::hasAny($permissions, 'edit'),
            'can_delete' => $isSuperAdmin || self::hasAny($permissions, 'delete'),
            'country_ids' => $isSuperAdmin ? [] : self::ids($access?->country_ids),
            'state_ids' => $isSuperAdmin ? [] : self::ids($access?->state_ids),
            'district_ids' => $isSuperAdmin ? [] : self::ids($access?->district_ids),
            'office_ids' => $isSuperAdmin ? [] : self::ids($access?->office_ids),
        ];
    }

    public static function can(User $user, string $module, string $action = 'read'): bool
    {
        if ((int) $user->role === 1) {
            return true;
        }

        $permissions = self::normalizePermissions($user->accessManagment?->permissions ?? []);

        return (bool) ($permissions[$module][$action] ?? false);
    }

    public static function normalizePermissions(array $permissions): array
    {
        $normalized = [];

        foreach (self::MODULES as $module => $label) {
            foreach (self::ACTIONS as $action) {
                $normalized[$module][$action] = (bool) ($permissions[$module][$action] ?? false);
            }
        }

        return $normalized;
    }

    public static function fullPermissions(): array
    {
        $permissions = [];

        foreach (self::MODULES as $module => $label) {
            foreach (self::ACTIONS as $action) {
                $permissions[$module][$action] = true;
            }
        }

        return $permissions;
    }

    private static function hasAny(array $permissions, string $action): bool
    {
        foreach ($permissions as $modulePermissions) {
            if (! empty($modulePermissions[$action])) {
                return true;
            }
        }

        return false;
    }

    public static function ids(?string $value): array
    {
        if (! $value) {
            return [];
        }

        return collect(explode(',', $value))
            ->map(fn (string $id) => trim($id))
            ->filter(fn (string $id) => $id !== '')
            ->map(fn (string $id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    public static function csv(array $ids): ?string
    {
        $value = collect($ids)
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->implode(',');

        return $value === '' ? null : $value;
    }
}
