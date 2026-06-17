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
        Schema::create('master_n_p_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('master_n_p_team_mappings');
            $table->foreignId('city_id')->constrained('master_np_cities')->cascadeOnDelete();
            $table->enum('post_name', ['P0', 'P1', 'P2', 'P3']);
            $table->foreignId('emp_id')->nullable()->constrained('master_employees');
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
        Schema::dropIfExists('master_n_p_mappings');
    }
};
