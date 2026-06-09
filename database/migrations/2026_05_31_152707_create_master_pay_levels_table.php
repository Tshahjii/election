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
        Schema::create('master_pay_levels', function (Blueprint $table) {
            $table->id();
            $table->string('level', 50)->unique();
            $table->decimal('min_amount_pay', 12, 2);
            $table->decimal('max_amount_pay', 12, 2);
            $table->string('grade_pay', 50);
            $table->tinyInteger('status')->default(1)->comment('1=Active,0=Inactive');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_pay_levels');
    }
};
