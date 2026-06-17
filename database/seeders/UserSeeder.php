<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure master tables have at least one record to map to
        // Seed Master Employee Types
        DB::table('master_emp_types')->updateOrInsert(
            ['emp_type' => 'Permanent'],
            [
                'status' => 1,
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
        $empTypeId = DB::table('master_emp_types')->where('emp_type', 'Permanent')->value('id') ?? 1;

        // Seed Master Departments
        DB::table('master_departments')->updateOrInsert(
            ['department' => 'Election Office'],
            [
                'status' => 1,
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
        $deptId = DB::table('master_departments')->where('department', 'Election Office')->value('id') ?? 1;

        // Seed Master Designations
        DB::table('master_designations')->updateOrInsert(
            ['designation' => 'Staff'],
            [
                'status' => 1,
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
        $desigId = DB::table('master_designations')->where('designation', 'Staff')->value('id') ?? 1;

        // 2. Define the list of users to seed with various roles
        // Roles: 1 = Super Admin, 2 = System Admin, 3 = Admin, 4 = Data Entry, 5 = Verifier, 6 = Booth Officer, 7 = Report Viewer
        $users = [
            [
                'user_code' => 'NIC-SHW-0001',
                'name' => 'Super Admin',
                'email' => 'superadmin@election.com',
                'mobile' => '9343326066',
                'role' => 1,
            ],
            [
                'user_code' => 'NIC-SHW-0002',
                'name' => 'System Admin',
                'email' => 'sysadmin@election.com',
                'mobile' => '9999999902',
                'role' => 2,
            ],
            [
                'user_code' => 'NIC-SHW-0003',
                'name' => 'Admin User',
                'email' => 'admin@election.com',
                'mobile' => '9999999903',
                'role' => 3,
            ],
            [
                'user_code' => 'NIC-SHW-0004',
                'name' => 'Data Entry User',
                'email' => 'dataentry@election.com',
                'mobile' => '9999999904',
                'role' => 4,
            ],
            [
                'user_code' => 'NIC-SHW-0005',
                'name' => 'Verifier User',
                'email' => 'verifier@election.com',
                'mobile' => '9999999905',
                'role' => 5,
            ],
            [
                'user_code' => 'NIC-SHW-0006',
                'name' => 'Booth Officer',
                'email' => 'booth@election.com',
                'mobile' => '9999999906',
                'role' => 6,
            ],
            [
                'user_code' => 'NIC-SHW-0007',
                'name' => 'Report Viewer',
                'email' => 'report@election.com',
                'mobile' => '9999999907',
                'role' => 7,
            ],
        ];

        // 3. Insert users
        $office = DB::table('master_offices')->first();
        $ofcId = $office ? $office->ofc_id : 1;
        $ofcCode = $office ? $office->office_code : 'CEO-CG';

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                [
                    'user_code' => $user['user_code'],
                    'name' => $user['name'],
                    'mobile' => $user['mobile'],
                    'user_verified_at' => now(),
                    'password' => Hash::make('Admin@123'),
                    'emp_type' => $empTypeId,
                    'department' => $deptId,
                    'designation' => $desigId,
                    'ofc_id' => $ofcId,
                    'ofc_code' => $ofcCode,
                    'country_id' => 1,   // India (as seeded in CountrySeeder)
                    'state_id' => 5,     // Chhattisgarh (as seeded in StateSeeder)
                    'district_id' => 1,  // Raipur (as seeded in DistrictSeeder)
                    'address' => 'Election Karyalay, Raipur',
                    'role' => $user['role'],
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
