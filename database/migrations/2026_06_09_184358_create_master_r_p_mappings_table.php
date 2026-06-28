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
        Schema::create('master_r_p_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('master_r_p_team_mappings');
            $table->unsignedBigInteger('pp_id');
            $table->enum('post_name', ['P0', 'P1', 'P2', 'P3', 'P4']);
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
        Schema::dropIfExists('master_r_p_mappings');
    }
};
