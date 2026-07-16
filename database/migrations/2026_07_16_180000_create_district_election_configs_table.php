<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('district_election_configs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('district_id')->unique();
            $table->date('dob_from')->nullable();
            $table->date('dob_to')->nullable();
            $table->boolean('same_city_duty_male')->default(true);
            $table->boolean('same_city_duty_female')->default(true);
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('master_districts')->onDelete('cascade');
        });

        Schema::create('district_election_salary_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('district_id');
            $table->string('post_name');
            $table->decimal('min_salary', 10, 2)->default(0);
            $table->string('comparison_operator')->default('above'); // 'above' or 'under'
            $table->timestamps();

            $table->foreign('district_id')->references('id')->on('master_districts')->onDelete('cascade');
            $table->unique(['district_id', 'post_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('district_election_salary_rules');
        Schema::dropIfExists('district_election_configs');
    }
};
