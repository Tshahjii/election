<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use App\Models\MasterElectionSalaryRule;
use App\Models\DistrictElectionSalaryRule;

class SalaryComparison
{
    public static function resolveOperator(?string $comparisonOperator): string
    {
        return $comparisonOperator === 'above' ? '>=' : '<';
    }

    /**
     * Apply range-based salary rules to the query.
     */
    public static function applyRangeFilter(Builder $query, string $postName, ?int $districtId, string $cityType): void
    {
        // Load all salary rules
        $rules = collect();
        if ($districtId) {
            $rules = DistrictElectionSalaryRule::where('district_id', $districtId)->get()->keyBy('post_name');
        }
        if ($rules->isEmpty()) {
            $rules = MasterElectionSalaryRule::query()->get()->keyBy('post_name');
        }

        // Extract thresholds (default to standard settings)
        $p0_val = isset($rules['P0']) ? (float)$rules['P0']->min_salary : 60000;
        $p1_val = isset($rules['P1']) ? (float)$rules['P1']->min_salary : 45000;
        $p2_val = isset($rules['P2']) ? (float)$rules['P2']->min_salary : 35000;
        $p3_val = isset($rules['P3']) ? (float)$rules['P3']->min_salary : 25000;
        $p4_val = isset($rules['P4']) ? (float)$rules['P4']->min_salary : 20000;

        $isUrban = ($cityType === 'urban');

        if ($postName === 'P0') {
            $query->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) >= ?', [$p0_val]);
        } elseif ($postName === 'P1') {
            $query->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) >= ?', [$p1_val])
                  ->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) < ?', [$p0_val]);
        } elseif ($postName === 'P2') {
            $query->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) >= ?', [$p2_val])
                  ->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) < ?', [$p1_val]);
        } elseif ($postName === 'P3') {
            if ($isUrban) {
                // Nagar Panchayat (Urban) has no P4, so P3 catches all below P2
                $query->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) < ?', [$p2_val]);
            } else {
                // Rural has P4, so P3 matches >= P3 threshold and < P2 threshold
                $query->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) >= ?', [$p3_val])
                      ->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) < ?', [$p2_val]);
            }
        } elseif ($postName === 'P4') {
            // P4 is only in Rural, catches all below P3
            $query->whereRaw('CAST(basic_pay AS DECIMAL(10,2)) < ?', [$p3_val]);
        }
    }
}
