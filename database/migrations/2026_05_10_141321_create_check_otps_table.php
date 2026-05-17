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
        Schema::create('check_otps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('mobile', 15)->nullable();
            $table->string('otp',6 )->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->tinyInteger('is_active')->default(1)->comment('1 = Active, 0 = Inactive');
            $table->timestamps();

            $table->index(['mobile', 'created_at']);
            $table->index(['mobile', 'is_active']);
            $table->index(['user_id', 'mobile', 'otp']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('check_otps');
    }
};
