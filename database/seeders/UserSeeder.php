<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            'name'=>'Super Admin',
            'email'=>'tinkukumarshah48@gmail.com',
            'mobile'=>'9343326066',
            'user_verified_at'=>now(),
            'password'=>Hash::make('Admin@123'),
            'emp_type'=>'Permanent',
            'department'=>'IT',
            'designation'=>'Developer',
            'district'=>'Raipur',
            'state'=>'Chhattisgarh',
            'country'=>'India',
            'role'=>3,
            'is_active'=>1,
            'last_active'=>now(),
            'last_active_ip'=>'127.0.0.1',
            'remember_token'=>null,
            'created_at'=>now(),
            'updated_at'=>now(),
        ]);
    }
}
