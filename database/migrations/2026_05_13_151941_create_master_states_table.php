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
        Schema::create('master_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('master_countries')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('state_code', 10)->nullable();
            $table->string('state_logo', 150)->nullable();
            $table->tinyInteger('status')->default(1)->comment('1=Active,0=Inactive');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_states');
    }
};
