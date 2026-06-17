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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('user_code', 30)->nullable()->unique();
            $table->string('name', 100);
            $table->string('email', 100)->unique();
            $table->string('mobile', 15)->unique();
            $table->timestamp('user_verified_at')->nullable();
            $table->string('password', 150);
            $table->timestamp('password_changed_at')->nullable();
            $table->unsignedBigInteger('emp_type',);
            $table->unsignedBigInteger('department');
            $table->unsignedBigInteger('designation');
            $table->unsignedBigInteger('ofc_id')->nullable();
            $table->string('ofc_code', 20)->nullable();
            $table->unsignedBigInteger('country_id');
            $table->unsignedBigInteger('state_id');
            $table->unsignedBigInteger('district_id');
            $table->text('address')->nullable();
            $table->tinyInteger('role')
                ->default(3)
                ->comment('1 = Super Admin, 2 = System Admin, 3 = Admin, 4 = Data Entry, 5 = Verifier, 6 = Booth Officer, 7 = Report Viewer');
            $table->tinyInteger('is_active')->default(1)->comment('1 = Active, 0 = Inactive');
            $table->timestamp('last_active')->nullable();
            $table->string('last_active_ip', 45)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index(['is_active', 'last_active']);
            $table->index(['ofc_id', 'ofc_code']);
            $table->index(['country_id', 'state_id', 'district_id']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
