<?php

namespace App\Http\Controllers;

use App\Models\DistrictElectionConfig;
use App\Models\DistrictElectionSalaryRule;
use App\Models\MasterDistrict;
use App\Models\MasterElectionSalaryRule;
use App\Support\AccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DistrictConfigController extends Controller
{
    public function getConfigs(Request $request): JsonResponse
    {
        $user = $request->user();
        $access = AccessScope::payload($user);

        // Fetch districts based on user scope
        $districtsQuery = MasterDistrict::query()->where('status', 1);
        if (!$access['is_super_admin']) {
            if ($access['district_ids']) {
                $districtsQuery->whereIn('id', $access['district_ids']);
            } else {
                $districtsQuery->whereRaw('1 = 0');
            }
        }
        $districts = $districtsQuery->orderBy('name')->get(['id', 'name']);

        $districtIds = $districts->pluck('id')->toArray();

        // Fetch existing configs
        $configs = DistrictElectionConfig::whereIn('district_id', $districtIds)->get()->keyBy('district_id');
        $salaryRules = DistrictElectionSalaryRule::whereIn('district_id', $districtIds)->get()->groupBy('district_id');

        // Fetch global fallback salary rules
        $globalRules = MasterElectionSalaryRule::orderBy('post_name')->get();

        $data = [];
        foreach ($districts as $district) {
            $config = $configs->get($district->id);
            $rulesList = $salaryRules->get($district->id) ?? collect();

            $formattedRules = [];
            foreach (['P0', 'P1', 'P2', 'P3', 'P4'] as $post) {
                $rule = $rulesList->firstWhere('post_name', $post);
                if ($rule) {
                    $formattedRules[] = [
                        'post_name' => $post,
                        'min_salary' => (float) $rule->min_salary,
                        'comparison_operator' => $rule->comparison_operator,
                    ];
                } else {
                    $globalRule = $globalRules->firstWhere('post_name', $post);
                    $formattedRules[] = [
                        'post_name' => $post,
                        'min_salary' => $globalRule ? (float) $globalRule->min_salary : 0,
                        'comparison_operator' => $globalRule ? $globalRule->comparison_operator : 'above',
                    ];
                }
            }

            $data[] = [
                'district_id' => $district->id,
                'district_name' => $district->name,
                'dob_from' => $config ? ($config->dob_from ? $config->dob_from->format('Y-m-d') : null) : null,
                'dob_to' => $config ? ($config->dob_to ? $config->dob_to->format('Y-m-d') : null) : null,
                'same_city_duty_male' => $config ? (bool)$config->same_city_duty_male : true,
                'same_city_duty_female' => $config ? (bool)$config->same_city_duty_female : true,
                'rules' => $formattedRules,
            ];
        }

        return response()->json($data);
    }

    public function saveConfig(Request $request): JsonResponse
    {
        $request->validate([
            'district_id' => 'required|integer|exists:master_districts,id',
            'dob_from' => 'nullable|date',
            'dob_to' => 'nullable|date',
            'same_city_duty_male' => 'required|boolean',
            'same_city_duty_female' => 'required|boolean',
            'rules' => 'required|array|min:4|max:5',
            'rules.*.post_name' => 'required|string|in:P0,P1,P2,P3,P4',
            'rules.*.min_salary' => 'required|numeric|min:0',
            'rules.*.comparison_operator' => 'required|string|in:above,under',
        ]);

        $districtId = $request->input('district_id');
        $user = $request->user();
        $access = AccessScope::payload($user);

        // Access check
        if (!$access['is_super_admin']) {
            if (!in_array((int)$districtId, $access['district_ids'], true)) {
                return response()->json(['message' => 'Unauthorized district access.'], 403);
            }
        }

        DB::transaction(function () use ($request, $districtId) {
            // Save main config
            DistrictElectionConfig::updateOrCreate(
                ['district_id' => $districtId],
                [
                    'dob_from' => $request->input('dob_from'),
                    'dob_to' => $request->input('dob_to'),
                    'same_city_duty_male' => $request->input('same_city_duty_male'),
                    'same_city_duty_female' => $request->input('same_city_duty_female'),
                ]
            );

            // Save salary rules
            $rules = $request->input('rules');
            foreach ($rules as $rule) {
                DistrictElectionSalaryRule::updateOrCreate(
                    [
                        'district_id' => $districtId,
                        'post_name' => $rule['post_name'],
                    ],
                    [
                        'min_salary' => $rule['min_salary'],
                        'comparison_operator' => $rule['comparison_operator'],
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'District configuration saved successfully.',
        ]);
    }
}
