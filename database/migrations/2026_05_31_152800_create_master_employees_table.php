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
            $table->string('emp_code', 30)->nullable()->unique();
            $table->string('title', 100);
            $table->string('name', 100);
            $table->tinyInteger('gender')->default(1)->comment('1 = Male, 2 = Female');
            $table->date('dob');
            $table->string('mobile', 15)->unique();
            $table->string('email', 100)->unique();
            $table->foreignId('emp_type_id')->constrained('master_emp_types')->restrictOnDelete();
            $table->foreignId('department_id')->constrained('master_departments')->restrictOnDelete();
            $table->foreignId('designation_id')->constrained('master_designations')->restrictOnDelete();
            $table->unsignedBigInteger('ofc_id')->nullable();
            $table->foreign('ofc_id')->references('ofc_id')->on('master_offices')->nullOnDelete();
            $table->foreignId('pay_level_id')->constrained('master_pay_levels')->restrictOnDelete();
            $table->string('basic_pay', 50);
            $table->tinyInteger('status')->default(1)->comment('1 = Active, 0 = Inactive');
            $table->foreignId('country_id')->constrained('master_countries')->restrictOnDelete();
            $table->foreignId('state_id')->constrained('master_states')->restrictOnDelete();
            $table->foreignId('district_id')->constrained('master_districts')->restrictOnDelete();
            $table->enum('city_type', ['urban', 'rural'])->default('urban');
            $table->foreignId('city_id')->constrained('master_cities')->restrictOnDelete();
            $table->tinyInteger('any_disability')->comment('1 = yes, 0 = no');
            $table->text('remark')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->index(['state_id', 'district_id', 'city_id']);
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
