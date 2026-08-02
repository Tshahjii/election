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
        Schema::table('complaints', function (Blueprint $table) {
            $table->unsignedBigInteger('district_id')->nullable()->after('user_id');
            $table->unsignedBigInteger('resolved_by')->nullable()->after('resolution');

            $table->foreign('district_id')->references('id')->on('master_districts')->nullOnDelete();
            $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropForeign(['district_id']);
            $table->dropForeign(['resolved_by']);
            $table->dropColumn(['district_id', 'resolved_by']);
        });
    }
};
