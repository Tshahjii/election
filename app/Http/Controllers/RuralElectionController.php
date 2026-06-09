<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RuralElectionController extends Controller
{
    public function createTeamsScheduled(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'required|integer|exists:master_rp_cities,id',
        ]);

        $cityId = $request->input('city_id');
        $user = $request->user();

        // 1. Get all polling stations for this city
        $pollingStations = DB::table('master_rp_polling_stations')
            ->where('city_id', $cityId)
            ->where('status', 1)
            ->get();

        if ($pollingStations->isEmpty()) {
            return response()->json([
                'message' => 'No active polling stations found for this city. Please create polling stations first.',
            ], 422);
        }

        DB::transaction(function () use ($pollingStations, $cityId, $user) {
            // 2. Delete existing team mapping rows for this city to prevent duplication
            $existingTeamIds = DB::table('master_r_p_team_mappings')
                ->where('city_id', $cityId)
                ->pluck('id');

            DB::table('master_r_p_mappings')->whereIn('team_id', $existingTeamIds)->delete();
            DB::table('master_r_p_team_mappings')->where('city_id', $cityId)->delete();

            // 3. Find the maximum sequential team_id across the whole database
            $maxTeamId = DB::table('master_r_p_team_mappings')->max('team_id') ?? 0;

            // 4. Generate teams
            foreach ($pollingStations as $index => $ps) {
                $seqTeamId = $maxTeamId + $index + 1;
                $posts = ['P0', 'P1', 'P2', 'P3', 'P4'];

                foreach ($posts as $post) {
                    $teamMappingId = DB::table('master_r_p_team_mappings')->insertGetId([
                        'team_id' => $seqTeamId,
                        'state_id' => $ps->state_id,
                        'district_id' => $ps->district_id,
                        'ward_id' => $ps->ward_id,
                        'city_id' => $ps->city_id,
                        'ps_id' => $ps->id,
                        'created_by' => $user->id,
                        'updated_by' => $user->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    DB::table('master_r_p_mappings')->insert([
                        'team_id' => $teamMappingId,
                        'post_name' => $post,
                        'emp_id' => null,
                        'created_by' => $user->id,
                        'updated_by' => $user->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Teams generated successfully.',
        ]);
    }

    public function dashboardData(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'required|integer|exists:master_rp_cities,id',
        ]);

        $cityId = $request->input('city_id');

        // Get city name and details
        $city = DB::table('master_rp_cities')->where('id', $cityId)->first();

        // Count stats
        $totalWards = DB::table('master_rp_wards')->where('city_id', $cityId)->where('status', 1)->count();
        $mappedWards = DB::table('master_r_p_team_mappings')->where('city_id', $cityId)->distinct()->count('ward_id');

        $totalBooths = DB::table('master_rp_polling_stations')->where('city_id', $cityId)->where('status', 1)->count();
        $mappedBooths = DB::table('master_r_p_team_mappings')->where('city_id', $cityId)->distinct()->count('ps_id');

        $teamsCount = DB::table('master_r_p_team_mappings')->where('city_id', $cityId)->distinct()->count('team_id');

        // Deployed count
        $deployedCount = DB::table('master_r_p_mappings')
            ->join('master_r_p_team_mappings', 'master_r_p_team_mappings.id', '=', 'master_r_p_mappings.team_id')
            ->where('master_r_p_team_mappings.city_id', $cityId)
            ->whereNotNull('master_r_p_mappings.emp_id')
            ->count();

        // Get teams
        $teamMappings = DB::table('master_r_p_team_mappings')
            ->join('master_rp_polling_stations', 'master_rp_polling_stations.id', '=', 'master_r_p_team_mappings.ps_id')
            ->join('master_rp_wards', 'master_rp_wards.id', '=', 'master_r_p_team_mappings.ward_id')
            ->where('master_r_p_team_mappings.city_id', $cityId)
            ->select([
                'master_r_p_team_mappings.id as mapping_id',
                'master_r_p_team_mappings.team_id',
                'master_rp_polling_stations.polling_station_name',
                'master_rp_wards.ward_no',
                'master_rp_wards.ward_name',
            ])
            ->get();

        // Load the P0-P4 posts for these team mappings
        $postsData = DB::table('master_r_p_mappings')
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

        return response()->json([
            'city_id' => $cityId,
            'city_name' => $city?->city_name,
            'stats' => [
                'total_wards' => $totalWards,
                'mapped_wards' => $mappedWards,
                'total_booths' => $totalBooths,
                'mapped_booths' => $mappedBooths,
                'teams_count' => $teamsCount,
                'deployed' => $deployedCount,
            ],
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
                DB::table('master_r_p_mappings')
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
}
