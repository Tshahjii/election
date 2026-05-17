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
            $table->string('name', 100);
            $table->string('email', 100)->unique();
            $table->string('mobile', 15)->unique();
            $table->timestamp('user_verified_at')->nullable();
            $table->string('password', 150);
            $table->timestamp('password_changed_at')->nullable();
            $table->string('emp_type', 20);
            $table->string('department', 20);
            $table->string('designation', 20);
            $table->string('ofc_id', 20);
            $table->string('ofc_code', 20);
            $table->string('district', 20);
            $table->string('state', 20);
            $table->string('country', 20);
            $table->tinyInteger('role')
                ->default(3)
                ->comment('1 = Super Admin, 2 = Admin, 3 = Data Entry, 4 = Verifier, 5 = Booth Officer, 6 = Report Viewer');
            $table->tinyInteger('is_active')->default(1)->comment('1 = Active, 0 = Inactive');
            $table->timestamp('last_active')->nullable();
            $table->string('last_active_ip', 45)->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index(['is_active', 'last_active']);
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
