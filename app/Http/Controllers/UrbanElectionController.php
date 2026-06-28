<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UrbanElectionController extends Controller
{
    public function createTeamsScheduled(Request $request): JsonResponse
{
    $request->validate([
        'city_id' => 'nullable|integer|exists:master_np_cities,id',
    ]);

    $cityId = $request->input('city_id');
    $user = $request->user();

    // 1. Get all polling stations for the selected city or for all cities
    $pollingStations = DB::table('master_np_polling_stations')
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
        $existingTeamIds = DB::table('master_n_p_team_mappings')
            ->whereIn('city_id', $cityIds)
            ->pluck('id');

        DB::table('master_n_p_mappings')->whereIn('team_id', $existingTeamIds)->delete();
        DB::table('master_n_p_team_mappings')->whereIn('city_id', $cityIds)->delete();

        // 3. Find the maximum sequential team_id across the whole database
        $maxTeamId = DB::table('master_n_p_team_mappings')->max('team_id') ?? 0;

        $mappingsData = [];
        $currentTime = now();
        $cityPpCounters = [];

        // 4. Generate data arrays and insert parent team mappings
        foreach ($pollingStations as $index => $ps) {
            $seqTeamId = $maxTeamId + $index + 1;
            $posts = ['P0', 'P1', 'P2', 'P3'];

            $cityId = $ps->city_id;
            if (!isset($cityPpCounters[$cityId])) {
                $cityPpCounters[$cityId] = 1;
            } else {
                $cityPpCounters[$cityId]++;
            }
            $ppId = $cityPpCounters[$cityId];

            // Team mapping table entry is created row-by-row to get the auto-incremented primary key ID
            $teamMappingId = DB::table('master_n_p_team_mappings')->insertGetId([
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

            // Using the actual primary key ID as team_id in master_n_p_mappings
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
            DB::table('master_n_p_mappings')->insert($mappingsData);
        }
    });

    return response()->json([
        'message' => 'Teams generated successfully.',
    ]);
}

    public function dashboardData(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'nullable|integer|exists:master_np_cities,id',
        ]);

        $cityId = $request->input('city_id');

        // Get city name and details
        $city = $cityId ? DB::table('master_np_cities')->where('id', $cityId)->first() : null;

        // Count stats
        $totalWards = DB::table('master_np_wards')
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->where('status', 1)
            ->count();
        $mappedWards = DB::table('master_n_p_team_mappings')
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->distinct()
            ->count('ward_id');

        $totalBooths = DB::table('master_np_polling_stations')
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->where('status', 1)
            ->count();
        $mappedBooths = DB::table('master_n_p_team_mappings')
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->distinct()
            ->count('ps_id');

        $teamsCount = DB::table('master_n_p_team_mappings')
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->distinct()
            ->count('team_id');

        // Deployed count
        $deployedCount = DB::table('master_n_p_mappings')
            ->join('master_n_p_team_mappings', 'master_n_p_team_mappings.id', '=', 'master_n_p_mappings.team_id')
            ->when($cityId, fn($query) => $query->where('master_n_p_team_mappings.city_id', $cityId))
            ->whereNotNull('master_n_p_mappings.emp_id')
            ->count();

        // Get teams
        $teamMappings = DB::table('master_n_p_team_mappings')
            ->join('master_np_polling_stations', 'master_np_polling_stations.id', '=', 'master_n_p_team_mappings.ps_id')
            ->join('master_np_wards', 'master_np_wards.id', '=', 'master_n_p_team_mappings.ward_id')
            ->when($cityId, fn($query) => $query->where('master_n_p_team_mappings.city_id', $cityId))
            ->select([
                'master_n_p_team_mappings.id as mapping_id',
                'master_n_p_team_mappings.team_id',
                'master_np_polling_stations.polling_station_name',
                'master_np_wards.ward_no',
                'master_np_wards.ward_name',
            ])
            ->get();

        // Load the P0-P3 posts for these team mappings
        $postsData = DB::table('master_n_p_mappings')
            ->leftJoin('master_employees', 'master_employees.id', '=', 'master_n_p_mappings.emp_id')
            ->whereIn('master_n_p_mappings.team_id', $teamMappings->pluck('mapping_id'))
            ->select([
                'master_n_p_mappings.id as post_mapping_id',
                'master_n_p_mappings.team_id as team_mapping_id',
                'master_n_p_mappings.post_name',
                'master_n_p_mappings.emp_id',
                'master_employees.name as employee_name',
                'master_employees.emp_code as employee_code',
            ])
            ->get()
            ->groupBy('team_mapping_id');

        $teams = [];
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
            ];
        }

        usort($teams, fn($a, $b) => $a['team_id'] - $b['team_id']);
        // Compute vacant counts per post (P0..P3)
        $vacantCountsRaw = DB::table('master_n_p_mappings')
            ->whereIn('team_id', $teamMappings->pluck('mapping_id'))
            ->whereNull('emp_id')
            ->select('post_name', DB::raw('count(*) as cnt'))
            ->groupBy('post_name')
            ->pluck('cnt', 'post_name')
            ->toArray();

        $postKeys = ['P0', 'P1', 'P2', 'P3'];
        $vacantByPost = [];
        foreach ($postKeys as $p) {
            $vacantByPost[$p] = isset($vacantCountsRaw[$p]) ? (int) $vacantCountsRaw[$p] : 0;
        }

        return response()->json([
            'city_id' => $cityId,
            'city_name' => $city?->city_name ?? 'All Nagar Panchayat Cities',
            'stats' => [
                'total_wards' => $totalWards,
                'mapped_wards' => $mappedWards,
                'total_booths' => $totalBooths,
                'mapped_booths' => $mappedBooths,
                'teams_count' => $teamsCount,
                'deployed' => $deployedCount,
            ],
            'vacant_by_post' => $vacantByPost,
            'teams' => $teams,
        ]);
    }

    public function saveAssignments(Request $request): JsonResponse
    {
        $request->validate([
            'assignments' => 'required|array',
            'assignments.*.post_mapping_id' => 'required|integer|exists:master_n_p_mappings,id',
            'assignments.*.emp_id' => 'nullable|integer|exists:master_employees,id',
        ]);

        $assignments = $request->input('assignments');
        $user = $request->user();

        DB::transaction(function () use ($assignments, $user) {
            foreach ($assignments as $item) {
                DB::table('master_n_p_mappings')
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
        // Accept either numeric employee_id or emp_code (like NIC001)
        $employeeId = $request->input('employee_id');
        $empCode = $request->input('emp_code');

        if (empty($employeeId) && empty($empCode)) {
            return response()->json(['message' => 'employee_id or emp_code is required.'], 422);
        }

        if (empty($employeeId) && !empty($empCode)) {
            $employeeId = DB::table('master_employees')->where('emp_code', $empCode)->value('id');
            if (!$employeeId) {
                return response()->json(['message' => 'Employee with provided code not found.'], 422);
            }
        }

        $user = $request->user();

        // Unassign this employee from any NP mappings
        $updated = DB::table('master_n_p_mappings')
            ->where('emp_id', $employeeId)
            ->update([
                'emp_id' => null,
                'updated_by' => $user->id,
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => "Employee exemptions applied. Updated: {$updated}",
            'updated' => $updated,
        ]);
    }

    public function applyDuty(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'nullable|integer|exists:master_np_cities,id',
            'date_of_birth' => 'nullable|date',
            'P0' => 'nullable|string|in:male,female,any',
            'P1' => 'nullable|string|in:male,female,any',
            'P2' => 'nullable|string|in:male,female,any',
            'P3' => 'nullable|string|in:male,female,any',
        ]);

        $cityId = $request->input('city_id');
        $dob = $request->input('date_of_birth');
        $user = $request->user();

        // 1. Get all team mapping IDs for this city or for all urban cities
        $teamMappingIds = DB::table('master_n_p_team_mappings')
            ->when($cityId, fn($query) => $query->where('city_id', $cityId))
            ->pluck('id');

        if ($teamMappingIds->isEmpty()) {
            return response()->json([
                'message' => 'No teams generated for this selection. Please generate teams first.',
            ], 422);
        }

        // 2. Fetch all vacant mappings for this city or for all urban cities
        $vacantMappings = DB::table('master_n_p_mappings')
            ->whereIn('team_id', $teamMappingIds)
            ->whereNull('emp_id')
            ->get();

        if ($vacantMappings->isEmpty()) {
            return response()->json([
                'message' => 'All duties are already assigned for this selection.',
            ], 422);
        }

        // 3. Fetch all active employees for this city type who are NOT already assigned anywhere
        $assignedEmpIdsNP = DB::table('master_n_p_mappings')
            ->whereNotNull('emp_id')
            ->pluck('emp_id')
            ->toArray();

        $employeesQuery = DB::table('master_employees')
            ->where('status', 1)
            ->where('city_type', 'urban')
            ->when($cityId, fn($query) => $query->where('city_id', $cityId));

        if (!empty($assignedEmpIdsNP)) {
            $employeesQuery->whereNotIn('id', $assignedEmpIdsNP);
        }

        if ($dob) {
            $employeesQuery->where('dob', '>=', $dob);
        }

        $employees = $employeesQuery->get();

        if ($employees->isEmpty()) {
            return response()->json([
                'message' => 'No available employees found matching the criteria.',
            ], 422);
        }

        // Split employees into male and female pools
        $malePool = $employees->where('gender', 1)->values()->all(); // 1 = Male
        $femalePool = $employees->where('gender', 2)->values()->all(); // 2 = Female

        $assignedCount = 0;
        $mappingsByPost = $vacantMappings->groupBy('post_name');

        DB::transaction(function () use ($mappingsByPost, $request, &$malePool, &$femalePool, $user, &$assignedCount) {
            $posts = ['P0', 'P1', 'P2', 'P3'];

            foreach ($posts as $post) {
                $genderCriteria = $request->input($post, 'any');
                $postMappings = $mappingsByPost->get($post);

                if (!$postMappings) {
                    continue;
                }

                foreach ($postMappings as $mapping) {
                    $emp = null;

                    if ($genderCriteria === 'male') {
                        if (!empty($malePool)) {
                            $emp = array_shift($malePool);
                        }
                    } elseif ($genderCriteria === 'female') {
                        if (!empty($femalePool)) {
                            $emp = array_shift($femalePool);
                        }
                    } else { // any
                        if (count($malePool) >= count($femalePool) && !empty($malePool)) {
                            $emp = array_shift($malePool);
                        } elseif (!empty($femalePool)) {
                            $emp = array_shift($femalePool);
                        } elseif (!empty($malePool)) {
                            $emp = array_shift($malePool);
                        }
                    }

                    if ($emp) {
                        DB::table('master_n_p_mappings')
                            ->where('id', $mapping->id)
                            ->update([
                                'emp_id' => $emp->id,
                                'updated_by' => $user->id,
                                'updated_at' => now(),
                            ]);
                        $assignedCount++;
                    }
                }
            }
        });

        if ($assignedCount === 0) {
            return response()->json([
                'message' => 'Could not assign any duties. Please check if you have enough employees matching the gender and DOB criteria.',
            ], 422);
        }

        return response()->json([
            'message' => "Successfully assigned duties to {$assignedCount} employees.",
        ]);
    }
}
