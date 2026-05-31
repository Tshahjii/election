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
        Schema::create('master_employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('emp_code')->nullable();
            $table->string('title', 100);
            $table->string('name', 100);
            $table->tinyInteger('gender')->default(1)->comment('1 = Male, 2 = Female');
            $table->string('dob', 10);
            $table->string('mobile', 15)->unique();
            $table->string('email', 100)->unique();
            $table->string('emp_type', 50);
            $table->string('department', 100);
            $table->string('designation', 100);
            $table->unsignedBigInteger('ofc_id')->nullable();
            $table->string('pay_level', 50);
            $table->string('basic_pay', 50);
            $table->tinyInteger('is_active')->default(1)->comment('1 = Active, 0 = Inactive');
            $table->unsignedBigInteger('country_id');
            $table->unsignedBigInteger('state_id');
            $table->unsignedBigInteger('district_id');
            $table->enum('city_type', ['urban', 'rural'])->default('urban');
            $table->unsignedBigInteger('city_area');
            $table->tinyInteger('any_disability')->comment('1 = yes, 0 = no');
            $table->text('remark')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_employees');
    }
};
