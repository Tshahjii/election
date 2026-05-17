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
        Schema::create('master_offices', function (Blueprint $table) {
            $table->id('ofc_id');
            $table->string('office_code', 20)->nullable()->unique();
            $table->string('office_name', 100);
            $table->string('company_name', 100)->nullable();
            $table->tinyInteger('office_type')->default(1)->comment('1 = Head Office, 2 = Branch Office');
            $table->unsignedBigInteger('ofc_parent_id')->default(0)->nullable();
            $table->tinyInteger('status')->default(1)->comment('1 = Active, 0 = Inactive');
            $table->string('district', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('attachment_path', 255)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->index(['status', 'office_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_offices');
    }
};
