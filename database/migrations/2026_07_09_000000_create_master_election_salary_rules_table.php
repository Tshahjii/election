<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_election_salary_rules', function (Blueprint $table) {
            $table->id();
            $table->string('post_name')->unique();
            $table->decimal('min_salary', 10, 2)->default(0);
            $table->string('comparison_operator')->default('above'); // 'above' or 'under'
            $table->timestamps();
        });

        // Insert initial/default values
        DB::table('master_election_salary_rules')->insert([
            ['post_name' => 'P0', 'min_salary' => 40000, 'comparison_operator' => 'above', 'created_at' => now(), 'updated_at' => now()],
            ['post_name' => 'P1', 'min_salary' => 35000, 'comparison_operator' => 'above', 'created_at' => now(), 'updated_at' => now()],
            ['post_name' => 'P2', 'min_salary' => 30000, 'comparison_operator' => 'above', 'created_at' => now(), 'updated_at' => now()],
            ['post_name' => 'P3', 'min_salary' => 30000, 'comparison_operator' => 'under', 'created_at' => now(), 'updated_at' => now()],
            ['post_name' => 'P4', 'min_salary' => 30000, 'comparison_operator' => 'under', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('master_election_salary_rules');
    }
};
