<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('check_otps', function (Blueprint $table) {
            $table->index(['user_id', 'mobile', 'is_active', 'verified_at', 'created_at'], 'check_otps_lookup_index');
        });

        Schema::table('master_n_p_team_mappings', function (Blueprint $table) {
            $table->index(['city_id', 'ps_id'], 'np_team_city_station_index');
            $table->index(['city_id', 'team_id'], 'np_team_city_team_index');
        });

        Schema::table('master_r_p_team_mappings', function (Blueprint $table) {
            $table->index(['city_id', 'ps_id'], 'rp_team_city_station_index');
            $table->index(['city_id', 'team_id'], 'rp_team_city_team_index');
        });

        Schema::table('master_n_p_mappings', function (Blueprint $table) {
            $table->index(['team_id', 'emp_id', 'post_name'], 'np_mapping_assignment_index');
        });

        Schema::table('master_r_p_mappings', function (Blueprint $table) {
            $table->index(['team_id', 'emp_id', 'post_name'], 'rp_mapping_assignment_index');
        });

        Schema::table('master_employees', function (Blueprint $table) {
            $table->index(['city_type', 'city_id', 'status'], 'employees_location_status_index');
        });

        Schema::table('exempt_employee_logs', function (Blueprint $table) {
            $table->index('created_at', 'exempt_logs_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('check_otps', fn (Blueprint $table) => $table->dropIndex('check_otps_lookup_index'));
        Schema::table('master_n_p_team_mappings', function (Blueprint $table) {
            $table->dropIndex('np_team_city_station_index');
            $table->dropIndex('np_team_city_team_index');
        });
        Schema::table('master_r_p_team_mappings', function (Blueprint $table) {
            $table->dropIndex('rp_team_city_station_index');
            $table->dropIndex('rp_team_city_team_index');
        });
        Schema::table('master_n_p_mappings', fn (Blueprint $table) => $table->dropIndex('np_mapping_assignment_index'));
        Schema::table('master_r_p_mappings', fn (Blueprint $table) => $table->dropIndex('rp_mapping_assignment_index'));
        Schema::table('master_employees', fn (Blueprint $table) => $table->dropIndex('employees_location_status_index'));
        Schema::table('exempt_employee_logs', fn (Blueprint $table) => $table->dropIndex('exempt_logs_created_at_index'));
    }
};
