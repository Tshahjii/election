<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Support\AccessScope;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $userId = DB::table('users')->insertGetId([
            'user_code'=>'USR-1001',
            'name'=>'Super Admin',
            'email'=>'tinkukumarshah48@gmail.com',
            'mobile'=>'9343326066',
            'user_verified_at'=>now(),
            'password'=>Hash::make('Admin@123'),
            'emp_type'=>'Permanent',
            'department'=>'Election Office',
            'designation'=>'Super Admin',
            'ofc_id'=>1,
            'ofc_code'=>'CEO-CG',
            'district'=>'Raipur',
            'state'=>'Chhattisgarh',
            'country'=>'India',
            'address'=>'Raipur, Chhattisgarh',
            'role'=>1,
            'is_active'=>1,
            'last_active'=>now(),
            'last_active_ip'=>'127.0.0.1',
            'created_by'=>null,
            'updated_by'=>null,
            'remember_token'=>null,
            'created_at'=>now(),
            'updated_at'=>now(),
        ]);

        DB::table('access_managments')->insert([
            'user_id' => $userId,
            'emp_type' => 'Permanent',
            'department' => 'Election Office',
            'designation' => 'Super Admin',
            'ofc_id' => 1,
            'ofc_code' => 'CEO-CG',
            'district' => 'Raipur',
            'state' => 'Chhattisgarh',
            'country' => 'India',
            'country_ids' => null,
            'state_ids' => null,
            'district_ids' => null,
            'office_ids' => null,
            'permissions' => json_encode(AccessScope::fullPermissions()),
            'can_create' => 1,
            'can_edit' => 1,
            'can_delete' => 1,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
