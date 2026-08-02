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
        Schema::table('district_election_salary_rules', function (Blueprint $table) {
            $table->json('designation_ids')->nullable()->after('comparison_operator');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('district_election_salary_rules', function (Blueprint $table) {
            $table->dropColumn('designation_ids');
        });
    }
};
