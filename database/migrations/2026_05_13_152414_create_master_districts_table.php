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
        Schema::create('master_districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('master_countries')->onDelete('cascade');
            $table->foreignId('state_id')->constrained('master_states')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('district_code', 10)->nullable();
            $table->tinyInteger('status')->default(1)->comment('1=Active,0=Inactive');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_districts');
    }
};
