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
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('emp_type', 50);
            $table->string('department', 100);
            $table->string('designation', 100)->nullable();
            $table->unsignedBigInteger('ofc_id')->nullable();
            $table->string('ofc_code', 20)->nullable();
            $table->string('district', 100);
            $table->string('state', 100);
            $table->string('country', 100);
            $table->text('country_ids')->nullable();
            $table->text('state_ids')->nullable();
            $table->text('district_ids')->nullable();
            $table->text('office_ids')->nullable();
            $table->json('permissions')->nullable();
            $table->tinyInteger('can_create')->default(0);
            $table->tinyInteger('can_edit')->default(0);
            $table->tinyInteger('can_delete')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->index(['ofc_id', 'ofc_code']);
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
