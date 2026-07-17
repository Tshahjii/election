<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\MasterRPCity;
use App\Models\MasterRPWard;
use App\Models\MasterRPPollingStation;
use App\Models\MasterRPTeamMapping;
use App\Models\MasterRPMapping;
use App\Models\MasterNPMapping;
use App\Models\MasterEmployee;
use App\Models\MasterElectionSalaryRule;

class RuralElectionController extends Controller
{
    public function createTeamsScheduled(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'nullable|integer|exists:master_rp_cities,id',
        ]);

        $cityId = $request->input('city_id');
        $user = $request->user();

        // 1. Get all polling stations for the selected city or for all cities
        $pollingStations = MasterRPPollingStation::query()
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->where('status', 1)
            ->get();

        if ($pollingStations->isEmpty()) {
            return response()->json([
                'message' => 'No active polling stations found for this selection. Please create polling stations first.',
            ], 422);
        }

        DB::transaction(function () use ($pollingStations, $user) {
            $cityIds = $pollingStations->pluck('city_id')->unique()->toArray();

            // 2. Delete existing rows for this city or selections to prevent duplication
            $existingTeamIds = MasterRPTeamMapping::query()
                ->whereIn('city_id', $cityIds)
                ->pluck('id');

            MasterRPMapping::query()->whereIn('team_id', $existingTeamIds)->delete();
            MasterRPTeamMapping::query()->whereIn('city_id', $cityIds)->delete();

            // 3. Find the maximum sequential team_id across the whole database
            $maxTeamId = MasterRPTeamMapping::query()->max('team_id') ?? 0;

            $mappingsData = [];
            $currentTime = now();
            $cityPpCounters = [];

            // 4. Generate data arrays and insert parent team mappings
            foreach ($pollingStations as $index => $ps) {
                $seqTeamId = $maxTeamId + $index + 1;
                $posts = ['P0', 'P1', 'P2', 'P3', 'P4'];

                $cityId = $ps->city_id;
                if (!isset($cityPpCounters[$cityId])) {
                    $cityPpCounters[$cityId] = 1;
                } else {
                    $cityPpCounters[$cityId]++;
                }
                $ppId = $cityPpCounters[$cityId];

                // Team mapping table entry is created row-by-row to get the auto-incremented primary key ID
                $teamMappingId = MasterRPTeamMapping::query()->insertGetId([
                    'team_id'      => $seqTeamId,
                    'state_id'     => $ps->state_id,
                    'district_id'  => $ps->district_id,
                    'ward_id'      => $ps->ward_id,
                    'city_id'      => $cityId,
                    'ps_id'        => $ps->id,
                    'created_by'   => $user->id,
                    'updated_by'   => $user->id,
                    'created_at'   => $currentTime,
                    'updated_at'   => $currentTime,
                ]);

                // Using the actual primary key ID as team_id in master_r_p_mappings
                foreach ($posts as $post) {
                    $mappingsData[] = [
                        'team_id'    => $teamMappingId,
                        'pp_id'      => $ppId,
                        'post_name'  => $post,
                        'emp_id'     => null,
                        'created_by' => $user->id,
                        'updated_by' => $user->id,
                        'created_at' => $currentTime,
                        'updated_at' => $currentTime,
                    ];
                }
            }

            // 5. Bulk Insert into Database for mappings posts
            if (!empty($mappingsData)) {
                MasterRPMapping::query()->insert($mappingsData);
            }
        });

        return response()->json([
            'message' => 'Teams generated successfully.',
        ]);
    }

    public function dashboardData(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'nullable|integer|exists:master_rp_cities,id',
        ]);

        $cityId = $request->input('city_id');

        // Get city name and details
        $city = $cityId ? MasterRPCity::query()->where('id', $cityId)->first() : null;

        // Count stats
        $totalWards = MasterRPWard::query()
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->where('status', 1)
            ->count();
        $mappedWards = MasterRPTeamMapping::query()
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->distinct()
            ->count('ward_id');

        $totalBooths = MasterRPPollingStation::query()
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->where('status', 1)
            ->count();
        $mappedBooths = MasterRPTeamMapping::query()
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->distinct()
            ->count('ps_id');

        $teamsCount = MasterRPTeamMapping::query()
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->distinct()
            ->count('team_id');

        // Deployed count
        $deployedCount = MasterRPMapping::query()
            ->join('master_r_p_team_mappings', 'master_r_p_team_mappings.id', '=', 'master_r_p_mappings.team_id')
            ->when($cityId, fn($query) => $query->where('master_r_p_team_mappings.city_id', $cityId))
            ->whereNotNull('master_r_p_mappings.emp_id')
            ->count();

        // Get teams (Only fetch teams list if city_id is selected to prevent massive payloads)
        $teams = [];
        if ($cityId) {
            $teamMappings = MasterRPTeamMapping::query()
                ->join('master_rp_polling_stations', 'master_rp_polling_stations.id', '=', 'master_r_p_team_mappings.ps_id')
                ->join('master_rp_wards', 'master_rp_wards.id', '=', 'master_r_p_team_mappings.ward_id')
                ->where('master_r_p_team_mappings.city_id', $cityId)
                ->select([
                    'master_r_p_team_mappings.id as mapping_id',
                    'master_r_p_team_mappings.team_id',
                    'master_rp_polling_stations.polling_station_name',
                    'master_rp_wards.ward_no',
                    'master_rp_wards.ward_name',
                    'master_r_p_team_mappings.city_id',
                ])
                ->get();

            // Load the P0-P4 posts for these team mappings
            $postsData = MasterRPMapping::query()
                ->leftJoin('master_employees', 'master_employees.id', '=', 'master_r_p_mappings.emp_id')
                ->whereIn('master_r_p_mappings.team_id', $teamMappings->pluck('mapping_id'))
                ->select([
                    'master_r_p_mappings.id as post_mapping_id',
                    'master_r_p_mappings.team_id as team_mapping_id',
                    'master_r_p_mappings.post_name',
                    'master_r_p_mappings.emp_id',
                    'master_employees.name as employee_name',
                    'master_employees.emp_code as employee_code',
                ])
                ->get()
                ->groupBy('team_mapping_id');

            $grouped = $teamMappings->groupBy('team_id');
            foreach ($grouped as $teamId => $rows) {
                $firstRow = $rows->first();
                $paddedTeamId = sprintf('%04d', $teamId);

                $posts = [];
                foreach ($rows as $row) {
                    $rowPosts = $postsData->get($row->mapping_id) ?? collect();
                    foreach ($rowPosts as $postInfo) {
                        $posts[] = [
                            'post_mapping_id' => $postInfo->post_mapping_id,
                            'post_name' => $postInfo->post_name,
                            'emp_id' => $postInfo->emp_id,
                            'employee_name' => $postInfo->employee_name,
                            'employee_code' => $postInfo->employee_code,
                        ];
                    }
                }

                usort($posts, fn($a, $b) => strcmp($a['post_name'], $b['post_name']));

                $teams[] = [
                    'team_id' => $teamId,
                    'padded_team_id' => $paddedTeamId,
                    'polling_station_name' => $firstRow->polling_station_name,
                    'ward_no' => $firstRow->ward_no,
                    'ward_name' => $firstRow->ward_name,
                    'posts' => $posts,
                    'city_id' => $firstRow->city_id,
                ];
            }

            usort($teams, fn($a, $b) => $a['team_id'] - $b['team_id']);
        }

        // Compute vacant counts per post (P0..P4)
        $vacantCountsRaw = MasterRPMapping::query()
            ->when($cityId, function ($query) use ($cityId) {
                $teamMappingIds = MasterRPTeamMapping::query()
                    ->where('city_id', $cityId)
                    ->pluck('id');
                return $query->whereIn('team_id', $teamMappingIds);
            })
            ->whereNull('emp_id')
            ->select('post_name', DB::raw('count(*) as cnt'))
            ->groupBy('post_name')
            ->pluck('cnt', 'post_name')
            ->toArray();

        $postKeys = ['P0', 'P1', 'P2', 'P3', 'P4'];
        $vacantByPost = [];
        foreach ($postKeys as $p) {
            $vacantByPost[$p] = isset($vacantCountsRaw[$p]) ? (int) $vacantCountsRaw[$p] : 0;
        }

        // Get vacant counts by city and post
        $vacantByCity = [];
        $cities = MasterRPCity::query()
            ->where('status', 1)
            ->get(['id', 'city_name', 'karyalay_name']);

        $vacantBreakdown = MasterRPMapping::query()
            ->join('master_r_p_team_mappings', 'master_r_p_team_mappings.id', '=', 'master_r_p_mappings.team_id')
            ->whereNull('master_r_p_mappings.emp_id')
            ->select('master_r_p_team_mappings.city_id', 'master_r_p_mappings.post_name', DB::raw('count(*) as cnt'))
            ->groupBy('master_r_p_team_mappings.city_id', 'master_r_p_mappings.post_name')
            ->get();

        $breakdownGrouped = $vacantBreakdown->groupBy('city_id');

        foreach ($cities as $c) {
            $cityBreakdown = $breakdownGrouped->get($c->id) ?? collect();
            $postsData = [];
            foreach ($postKeys as $p) {
                $item = $cityBreakdown->firstWhere('post_name', $p);
                $postsData[$p] = $item ? (int) $item->cnt : 0;
            }
            $vacantByCity[] = [
                'city_id' => $c->id,
                'city_name' => $c->karyalay_name ?: $c->city_name,
                'vacant' => $postsData,
            ];
        }

        return response()->json([
            'city_id' => $cityId,
            'city_name' => $city?->city_name ?? 'All Rural Constituency Cities',
            'stats' => [
                'total_wards' => $totalWards,
                'mapped_wards' => $mappedWards,
                'total_booths' => $totalBooths,
                'mapped_booths' => $mappedBooths,
                'teams_count' => $teamsCount,
                'deployed' => $deployedCount,
            ],
            'vacant_by_post' => $vacantByPost,
            'vacant_by_city' => $vacantByCity,
            'teams' => $teams,
        ]);
    }

    public function saveAssignments(Request $request): JsonResponse
    {
        $request->validate([
            'assignments' => 'required|array',
            'assignments.*.post_mapping_id' => 'required|integer|exists:master_r_p_mappings,id',
            'assignments.*.emp_id' => 'nullable|integer|exists:master_employees,id',
        ]);

        $assignments = $request->input('assignments');
        $user = $request->user();

        DB::transaction(function () use ($assignments, $user) {
            foreach ($assignments as $item) {
                MasterRPMapping::query()
                    ->where('id', $item['post_mapping_id'])
                    ->update([
                        'emp_id' => $item['emp_id'],
                        'updated_by' => $user->id,
                        'updated_at' => now(),
                    ]);
            }
        });

        return response()->json([
            'message' => 'Team assignments saved successfully.',
        ]);
    }

    public function exemptEmployee(Request $request): JsonResponse
    {
        $employeeIdInput = $request->input('employee_id');
        $empCodeInput = $request->input('emp_code');

        if (empty($employeeIdInput) && empty($empCodeInput)) {
            return response()->json(['message' => 'employee_id or emp_code is required.'], 422);
        }

        $employeeIds = [];

        if (!empty($employeeIdInput)) {
            $ids = array_filter(array_map('trim', explode(',', $employeeIdInput)));
            $employeeIds = array_merge($employeeIds, $ids);
        }

        if (!empty($empCodeInput)) {
            $codes = array_filter(array_map('trim', explode(',', $empCodeInput)));
            $foundIds = MasterEmployee::query()
                ->whereIn('emp_code', $codes)
                ->pluck('id')
                ->toArray();
            
            $employeeIds = array_merge($employeeIds, $foundIds);
        }

        if (empty($employeeIds)) {
            return response()->json(['message' => 'No matching employees found for the provided code(s).'], 422);
        }

        $user = $request->user();

        // Unassign these employees from any RP mappings
        $updated = MasterRPMapping::query()
            ->whereIn('emp_id', $employeeIds)
            ->update([
                'emp_id' => null,
                'updated_by' => $user->id,
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => "Employee exemptions applied. Updated: {$updated} assignment(s).",
            'updated' => $updated,
        ]);
    }

    public function applyDuty(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'nullable|integer|exists:master_rp_cities,id',
            'date_of_birth' => 'nullable|date',
            'P0' => 'nullable|string|in:male,female,any',
            'P1' => 'nullable|string|in:male,female,any',
            'P2' => 'nullable|string|in:male,female,any',
            'P3' => 'nullable|string|in:male,female,any',
            'P4' => 'nullable|string|in:male,female,any',
        ]);

        $cityId = $request->input('city_id');
        $dob = $request->input('date_of_birth');
        $user = $request->user();

        // 1. Get all team mapping IDs for this city or for all rural cities
        $teamMappingIds = MasterRPTeamMapping::query()
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->pluck('id');

        if ($teamMappingIds->isEmpty()) {
            return response()->json([
                'message' => 'No teams generated for this selection. Please generate teams first.',
            ], 422);
        }

        // 2. Fetch all vacant mappings for this city or for all rural cities
        $vacantMappings = MasterRPMapping::query()
            ->whereIn('team_id', $teamMappingIds)
            ->whereNull('emp_id')
            ->get();

        if ($vacantMappings->isEmpty()) {
            return response()->json([
                'message' => 'All duties are already assigned for this selection.',
            ], 422);
        }

        $assignedCount = 0;

        // Resolve district ID
        $districtId = null;
        if ($cityId) {
            $districtId = DB::table('master_rp_cities')->where('id', $cityId)->value('district_id');
        } else {
            $districtId = $user->district_id ?: (AccessScope::payload($user)['district_ids'][0] ?? null);
        }

        // Load district configurations
        $distConfig = null;
        if ($districtId) {
            $distConfig = DB::table('district_election_configs')->where('district_id', $districtId)->first();
        }

        // Load salary rules (district-specific or fallback to global)
        $salaryRules = collect();
        if ($districtId) {
            $salaryRules = \App\Models\DistrictElectionSalaryRule::where('district_id', $districtId)->get()->keyBy('post_name');
        }
        if ($salaryRules->isEmpty()) {
            $salaryRules = \App\Models\MasterElectionSalaryRule::get()->keyBy('post_name');
        }

        DB::transaction(function () use ($vacantMappings, $salaryRules, $distConfig, $request, $cityId, $districtId, $dob, $user, &$assignedCount, $teamMappingIds) {
            $posts = ['P0', 'P1', 'P2', 'P3', 'P4'];
            $newlyAssignedIds = [];

            // Fetch currently assigned employee IDs across both NP and RP
            $assignedNP = MasterNPMapping::query()->whereNotNull('emp_id')->pluck('emp_id')->toArray();
            $assignedRP = MasterRPMapping::query()->whereNotNull('emp_id')->pluck('emp_id')->toArray();
            $globalAssignedIds = array_unique(array_merge($assignedNP, $assignedRP));

            // Group vacant mappings by post name
            $mappingsByPost = $vacantMappings->groupBy('post_name');

            foreach ($posts as $post) {
                $genderCriteria = $request->input($post, 'any');
                $postMappings = $mappingsByPost->get($post);

                if (!$postMappings || $postMappings->isEmpty()) {
                    continue;
                }

                $rule = $salaryRules->get($post);

                // Fetch all unassigned district employees matching this post's criteria
                $allAssignedIds = array_unique(array_merge($globalAssignedIds, $newlyAssignedIds));

                $empQuery = MasterEmployee::query()
                    ->where('status', 1)
                    ->where('city_type', 'rural');

                if ($districtId) {
                    $empQuery->where('district_id', $districtId);
                }

                if (!empty($allAssignedIds)) {
                    $empQuery->whereNotIn('id', $allAssignedIds);
                }

                // Check DOB limits from district config
                if ($distConfig) {
                    if ($distConfig->dob_from) {
                        $empQuery->where('dob', '>=', $distConfig->dob_from);
                    }
                    if ($distConfig->dob_to) {
                        $empQuery->where('dob', '<=', $distConfig->dob_to);
                    }
                }

                // Check manual DOB filter from request
                if ($dob) {
                    $empQuery->where('dob', '>=', $dob);
                }

                // Check gender filter
                if ($genderCriteria === 'male') {
                    $empQuery->where('gender', 1);
                } elseif ($genderCriteria === 'female') {
                    $empQuery->where('gender', 2);
                }

                // Check salary rules
                if ($rule) {
                    $op = $rule->comparison_operator === 'above' ? '>=' : '<';
                    $empQuery->whereRaw("CAST(basic_pay AS DECIMAL(10,2)) {$op} ?", [$rule->min_salary]);
                }

                $availableEmps = $empQuery
                    ->inRandomOrder()
                    ->get(['id', 'city_id', 'gender']);

                // Fetch post mappings details (joined with team mappings to know target city)
                $mappedRows = MasterRPMapping::query()
                    ->join('master_r_p_team_mappings', 'master_r_p_team_mappings.id', '=', 'master_r_p_mappings.team_id')
                    ->whereIn('master_r_p_mappings.id', $postMappings->pluck('id'))
                    ->select('master_r_p_mappings.id as post_mapping_id', 'master_r_p_team_mappings.city_id as dest_city_id')
                    ->get();

                foreach ($mappedRows as $mapping) {
                    $candidateKey = null;

                    // Same-city restriction config
                    $sameCityMaleAllowed = $distConfig->same_city_duty_male ?? true;
                    $sameCityFemaleAllowed = $distConfig->same_city_duty_female ?? true;

                    // First pass: try to assign to same city if allowed
                    foreach ($availableEmps as $key => $emp) {
                        if (in_array($emp->id, $newlyAssignedIds)) {
                            continue;
                        }

                        $sameCityAllowed = (int)$emp->gender === 2 ? $sameCityFemaleAllowed : $sameCityMaleAllowed;
                        $isSameCity = (int)$emp->city_id === (int)$mapping->dest_city_id;

                        if ($isSameCity) {
                            if ($sameCityAllowed) {
                                $candidateKey = $key;
                                break;
                            }
                        }
                    }

                    // Second pass: fallback or find different city
                    if ($candidateKey === null) {
                        foreach ($availableEmps as $key => $emp) {
                            if (in_array($emp->id, $newlyAssignedIds)) {
                                continue;
                            }

                            $sameCityAllowed = (int)$emp->gender === 2 ? $sameCityFemaleAllowed : $sameCityMaleAllowed;
                            $isSameCity = (int)$emp->city_id === (int)$mapping->dest_city_id;

                            if (!$isSameCity || $sameCityAllowed) {
                                $candidateKey = $key;
                                break;
                            }
                        }
                    }

                    if ($candidateKey !== null) {
                        $empId = $availableEmps[$candidateKey]->id;
                        MasterRPMapping::query()
                            ->where('id', $mapping->post_mapping_id)
                            ->update([
                                'emp_id' => $empId,
                                'updated_by' => $user->id,
                                'updated_at' => now(),
                            ]);
                        $newlyAssignedIds[] = $empId;
                        $assignedCount++;
                    }
                }
            }
        });

        if ($assignedCount === 0) {
            return response()->json([
                'message' => 'Could not assign any duties. Please check if you have enough employees matching the salary, gender, DOB and Same City configuration criteria.',
            ], 422);
        }

        return response()->json([
            'message' => "Successfully assigned duties to {$assignedCount} employees.",
        ]);
    }

    public function applyTargetedDuty(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'required|integer|exists:master_rp_cities,id',
            'post_name' => 'required|string|in:P0,P1,P2,P3,P4',
            'gender' => 'required|string|in:male,female,any',
            'designation_id' => 'nullable|integer|exists:master_designations,id',
            'limit' => 'required|integer|min:1',
        ]);

        $cityId = $request->input('city_id');
        $postName = $request->input('post_name');
        $gender = $request->input('gender');
        $designationId = $request->input('designation_id');
        $limit = (int) $request->input('limit');
        $user = $request->user();

        // 1. Fetch vacant mappings for this city and post
        $vacantMappings = MasterRPMapping::query()
            ->join('master_r_p_team_mappings', 'master_r_p_team_mappings.id', '=', 'master_r_p_mappings.team_id')
            ->where('master_r_p_team_mappings.city_id', $cityId)
            ->where('master_r_p_mappings.post_name', $postName)
            ->whereNull('master_r_p_mappings.emp_id')
            ->select('master_r_p_mappings.id')
            ->limit($limit)
            ->get();

        if ($vacantMappings->isEmpty()) {
            return response()->json([
                'message' => 'No vacant slots found for the selected post in this city.',
            ], 422);
        }

        $actualLimit = count($vacantMappings);

        // 2. Fetch all assigned employees to avoid double assignment
        $assignedNP = MasterNPMapping::query()->whereNotNull('emp_id')->pluck('emp_id')->toArray();
        $assignedRP = MasterRPMapping::query()->whereNotNull('emp_id')->pluck('emp_id')->toArray();
        $assignedEmpIds = array_unique(array_merge($assignedNP, $assignedRP));

        // 3. Find matching active employees
        $employeesQuery = MasterEmployee::query()
            ->where('status', 1)
            ->where('city_type', 'rural');

        $districtId = DB::table('master_rp_cities')->where('id', $cityId)->value('district_id');
        $distConfig = DB::table('district_election_configs')->where('district_id', $districtId)->first();

        // DOB config check
        if ($distConfig) {
            if ($distConfig->dob_from) {
                $employeesQuery->where('dob', '>=', $distConfig->dob_from);
            }
            if ($distConfig->dob_to) {
                $employeesQuery->where('dob', '<=', $distConfig->dob_to);
            }
        }

        // Salary rule check
        $rule = null;
        if ($districtId) {
            $rule = \App\Models\DistrictElectionSalaryRule::where('district_id', $districtId)
                ->where('post_name', $postName)
                ->first();
        }
        if (!$rule) {
            $rule = MasterElectionSalaryRule::where('post_name', $postName)->first();
        }
        if ($rule) {
            $op = $rule->comparison_operator === 'above' ? '>=' : '<';
            $employeesQuery->whereRaw("CAST(basic_pay AS DECIMAL(10,2)) {$op} ?", [$rule->min_salary]);
        }

        // Same-city restriction check
        $sameCityMaleAllowed = $distConfig->same_city_duty_male ?? true;
        $sameCityFemaleAllowed = $distConfig->same_city_duty_female ?? true;

        // Query employees of the same district
        if ($districtId) {
            $employeesQuery->where('district_id', $districtId);
        }

        if (!empty($assignedEmpIds)) {
            $employeesQuery->whereNotIn('id', $assignedEmpIds);
        }

        if ($gender === 'male') {
            $employeesQuery->where('gender', 1);
            if (!$sameCityMaleAllowed) {
                $employeesQuery->where('city_id', '<>', $cityId);
            } else {
                $employeesQuery->orderByRaw("CASE WHEN city_id = ? THEN 0 ELSE 1 END", [$cityId]);
            }
        } elseif ($gender === 'female') {
            $employeesQuery->where('gender', 2);
            if (!$sameCityFemaleAllowed) {
                $employeesQuery->where('city_id', '<>', $cityId);
            } else {
                $employeesQuery->orderByRaw("CASE WHEN city_id = ? THEN 0 ELSE 1 END", [$cityId]);
            }
        } else {
            // Gender is 'any'
            if (!$sameCityMaleAllowed && !$sameCityFemaleAllowed) {
                $employeesQuery->where('city_id', '<>', $cityId);
            } elseif (!$sameCityMaleAllowed) {
                $employeesQuery->where(function($q) use ($cityId) {
                    $q->where('gender', 2)
                      ->orWhere(function($sub) use ($cityId) {
                          $sub->where('gender', 1)->where('city_id', '<>', $cityId);
                      });
                });
                $employeesQuery->orderByRaw("CASE WHEN city_id = ? THEN 0 ELSE 1 END", [$cityId]);
            } elseif (!$sameCityFemaleAllowed) {
                $employeesQuery->where(function($q) use ($cityId) {
                    $q->where('gender', 1)
                      ->orWhere(function($sub) use ($cityId) {
                          $sub->where('gender', 2)->where('city_id', '<>', $cityId);
                      });
                });
                $employeesQuery->orderByRaw("CASE WHEN city_id = ? THEN 0 ELSE 1 END", [$cityId]);
            } else {
                $employeesQuery->orderByRaw("CASE WHEN city_id = ? THEN 0 ELSE 1 END", [$cityId]);
            }
        }

        if ($designationId) {
            $employeesQuery->where('designation_id', $designationId);
        }

        $availableEmployees = $employeesQuery
            ->inRandomOrder()
            ->limit($actualLimit)
            ->pluck('id')
            ->toArray();

        if (empty($availableEmployees)) {
            return response()->json([
                'message' => 'No available employees matching the criteria found.',
            ], 422);
        }

        $assignedCount = 0;
        DB::transaction(function () use ($vacantMappings, $availableEmployees, $user, &$assignedCount) {
            foreach ($vacantMappings as $index => $mapping) {
                if (!isset($availableEmployees[$index])) {
                    break;
                }
                MasterRPMapping::query()
                    ->where('id', $mapping->id)
                    ->update([
                        'emp_id' => $availableEmployees[$index],
                        'updated_by' => $user->id,
                        'updated_at' => now(),
                    ]);
                $assignedCount++;
            }
        });

        if ($assignedCount === 0) {
            return response()->json([
                'message' => 'Could not assign duties. No matching employees were available.',
            ], 422);
        }

        return response()->json([
            'message' => "Successfully assigned duties to {$assignedCount} employees.",
        ]);
    }
}
