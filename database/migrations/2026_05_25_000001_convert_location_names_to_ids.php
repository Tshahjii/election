<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->convertTable('users', true);
        $this->convertTable('access_managments', true);
        $this->convertTable('master_offices', true);
    }

    public function down(): void
    {
        $this->restoreTable('users', false);
        $this->restoreTable('access_managments', true);
        $this->restoreTable('master_offices', true);
    }

    private function convertTable(string $table, bool $nullable): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        Schema::table($table, function (Blueprint $tableBlueprint) use ($table, $nullable): void {
            foreach (['country_id', 'state_id', 'district_id'] as $column) {
                if (! Schema::hasColumn($table, $column)) {
                    $field = $tableBlueprint->unsignedBigInteger($column);
                    if ($nullable) {
                        $field->nullable();
                    }
                }
            }
        });

        if (Schema::hasColumn($table, 'country')) {
            DB::table($table)
                ->leftJoin('master_countries', "{$table}.country", '=', 'master_countries.name')
                ->whereNotNull("{$table}.country")
                ->update(["{$table}.country_id" => DB::raw('master_countries.id')]);
        }

        if (Schema::hasColumn($table, 'state')) {
            DB::table($table)
                ->leftJoin('master_states', "{$table}.state", '=', 'master_states.name')
                ->whereNotNull("{$table}.state")
                ->update(["{$table}.state_id" => DB::raw('master_states.id')]);
        }

        if (Schema::hasColumn($table, 'district')) {
            DB::table($table)
                ->leftJoin('master_districts', "{$table}.district", '=', 'master_districts.name')
                ->whereNotNull("{$table}.district")
                ->update(["{$table}.district_id" => DB::raw('master_districts.id')]);
        }

        Schema::table($table, function (Blueprint $tableBlueprint) use ($table): void {
            foreach (['country', 'state', 'district'] as $column) {
                if (Schema::hasColumn($table, $column)) {
                    $tableBlueprint->dropColumn($column);
                }
            }
        });
    }

    private function restoreTable(string $table, bool $nullable): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        Schema::table($table, function (Blueprint $tableBlueprint) use ($table, $nullable): void {
            foreach (['country', 'state', 'district'] as $column) {
                if (! Schema::hasColumn($table, $column)) {
                    $field = $tableBlueprint->string($column, 100);
                    if ($nullable) {
                        $field->nullable();
                    }
                }
            }
        });

        if (Schema::hasColumn($table, 'country_id')) {
            DB::table($table)
                ->leftJoin('master_countries', "{$table}.country_id", '=', 'master_countries.id')
                ->update(["{$table}.country" => DB::raw('master_countries.name')]);
        }

        if (Schema::hasColumn($table, 'state_id')) {
            DB::table($table)
                ->leftJoin('master_states', "{$table}.state_id", '=', 'master_states.id')
                ->update(["{$table}.state" => DB::raw('master_states.name')]);
        }

        if (Schema::hasColumn($table, 'district_id')) {
            DB::table($table)
                ->leftJoin('master_districts', "{$table}.district_id", '=', 'master_districts.id')
                ->update(["{$table}.district" => DB::raw('master_districts.name')]);
        }
    }
};
