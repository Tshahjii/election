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
        Schema::create('exempt_employee_logs', function (Blueprint $table) {
            $table->id();
            $table->string('emp_code');
            $table->foreignId('employee_id')->nullable()->constrained('master_employees')->nullOnDelete();
            $table->string('urban_post')->nullable();
            $table->string('rural_post')->nullable();
            $table->foreignId('urban_mapping_id')->nullable()->constrained('master_n_p_mappings')->nullOnDelete();
            $table->foreignId('rural_mapping_id')->nullable()->constrained('master_r_p_mappings')->nullOnDelete();
            $table->text('urban_reason')->nullable();
            $table->text('rural_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exempt_employee_logs');
    }
};
