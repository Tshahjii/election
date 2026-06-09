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
        Schema::create('master_np_wards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('state_id')->constrained('master_states')->onDelete('cascade');
            $table->foreignId('district_id')->constrained('master_districts')->onDelete('cascade');
            $table->foreignId('city_id')->constrained('master_np_cities')->onDelete('cascade');
            $table->unsignedBigInteger('ward_no');
            $table->string('ward_name', 150);
            $table->tinyInteger('status')->default(1)->comment('1=Active,0=Inactive');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['city_id', 'ward_no']);
            $table->unique(['city_id', 'ward_name']);
        });

        Schema::create('master_rp_wards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('state_id')->constrained('master_states')->onDelete('cascade');
            $table->foreignId('district_id')->constrained('master_districts')->onDelete('cascade');
            $table->foreignId('city_id')->constrained('master_rp_cities')->onDelete('cascade');
            $table->unsignedBigInteger('ward_no');
            $table->string('ward_name', 150);
            $table->tinyInteger('status')->default(1)->comment('1=Active,0=Inactive');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['city_id', 'ward_no']);
            $table->unique(['city_id', 'ward_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_np_wards');
        Schema::dropIfExists('master_rp_wards');
    }
};
