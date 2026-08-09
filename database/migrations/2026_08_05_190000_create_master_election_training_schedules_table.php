<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('master_election_training_schedules');

        Schema::create('master_election_training_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('district_id')->nullable();
            $table->string('election_type')->default('urban');
            $table->text('purpose');
            $table->string('date')->nullable();
            $table->string('time')->nullable();
            $table->string('venue')->nullable();
            $table->integer('sort_order')->default(1);
            $table->timestamps();

            $table->index(['district_id', 'election_type'], 'idx_dist_elect_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_election_training_schedules');
    }
};
