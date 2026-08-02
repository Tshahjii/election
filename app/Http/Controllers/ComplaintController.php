<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Support\AccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $access = AccessScope::payload($user);

        $query = Complaint::query()
            ->with(['user:id,name,mobile', 'resolver:id,name', 'district:id,name'])
            ->latest();

        if ((int) $user->role > 2) {
            $districtIds = collect($access['district_ids'] ?? [])
                ->push($user->district_id)
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (!empty($districtIds)) {
                $query->where(function ($q) use ($user, $districtIds) {
                    $q->whereIn('district_id', $districtIds)
                      ->orWhere('user_id', $user->id);
                });
            } else {
                $query->where('user_id', $user->id);
            }
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:5000'],
            'category' => ['required', 'in:application,login,data,other'],
            'district_id' => ['nullable', 'integer', 'exists:master_districts,id'],
        ]);

        $districtId = $data['district_id'] ?? $request->user()->district_id;

        $complaint = Complaint::create($data + [
            'user_id' => $request->user()->id,
            'district_id' => $districtId,
        ]);

        return response()->json([
            'message' => 'Complaint submitted successfully.',
            'data' => $complaint->load(['user:id,name,mobile', 'district:id,name'])
        ], 201);
    }

    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        $user = $request->user();
        $access = AccessScope::payload($user);
        $isSuperSystem = in_array((int) $user->role, [1, 2], true);

        if (!$isSuperSystem) {
            $districtIds = collect($access['district_ids'] ?? [])
                ->push($user->district_id)
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (empty($districtIds) || ($complaint->district_id && !in_array((int)$complaint->district_id, $districtIds, true))) {
                abort(403, 'Unauthorized to update this complaint.');
            }
        }

        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved'],
            'resolution' => ['nullable', 'string', 'max:5000'],
        ]);

        $updateData = [
            'status' => $data['status'],
            'resolution' => $data['resolution'] ?? null,
        ];

        if ($data['status'] === 'resolved') {
            $updateData['resolved_at'] = now();
            $updateData['resolved_by'] = $user->id;
        } else {
            $updateData['resolved_at'] = null;
            $updateData['resolved_by'] = null;
        }

        $complaint->fill($updateData)->save();

        return response()->json([
            'message' => 'Complaint updated successfully.',
            'data' => $complaint->fresh(['user', 'resolver', 'district'])
        ]);
    }
}
