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
        Schema::create('access_managments', function (Blueprint $table) {
            $table->id();
            $table->string('user_id',20);
            $table->string('emp_type', 20);
            $table->string('department', 20);
            $table->string('district', 20);
            $table->string('state', 20);
            $table->string('country', 20);
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_managments');
    }
};
