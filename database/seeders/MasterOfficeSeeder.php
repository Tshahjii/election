<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterOfficeSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('master_offices')->insert([
            [
                'office_code' => 'CEO-CG',
                'office_name' => 'Chief Electoral Office',
                'company_name' => 'Election Department',
                'office_type' => 1,
                'ofc_parent_id' => 0,
                'status' => 1,
                'country_id' => 1,
                'state_id' => 5,
                'district_id' => 1,
                'attachment_path' => null,
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
