<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('master_r_p_team_mappings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id');
            $table->foreignId('state_id')->constrained('master_states')->cascadeOnDelete();
            $table->foreignId('district_id')->constrained('master_districts')->cascadeOnDelete();
            $table->foreignId('ward_id')->constrained('master_rp_wards')->cascadeOnDelete();
            $table->foreignId('city_id')->constrained('master_rp_cities')->cascadeOnDelete();
            $table->foreignId('ps_id')->constrained('master_rp_polling_stations')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_r_p_team_mappings');
    }
};
