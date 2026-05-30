<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CalendarEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CalendarEvent::query()->where('user_id', $request->user()->id);

        if ($request->filled('start') && $request->filled('end')) {
            $start = Carbon::parse((string) $request->query('start'))->startOfDay();
            $end = Carbon::parse((string) $request->query('end'))->endOfDay();

            $query->where('start_at', '<=', $end)
                ->where('end_at', '>=', $start);
        }

        $events = $query
            ->orderBy('start_at')
            ->get()
            ->map(fn (CalendarEvent $event) => $this->payload($event));

        return response()->json(['data' => $events]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['user_id'] = $request->user()->id;

        $event = CalendarEvent::query()->create($data);

        return response()->json([
            'message' => 'Calendar event created successfully.',
            'data' => $this->payload($event),
        ], 201);
    }

    public function update(Request $request, CalendarEvent $calendarEvent): JsonResponse
    {
        abort_unless((int) $calendarEvent->user_id === (int) $request->user()->id, 403);

        $calendarEvent->fill($this->validated($request))->save();

        return response()->json([
            'message' => 'Calendar event updated successfully.',
            'data' => $this->payload($calendarEvent->fresh()),
        ]);
    }

    public function destroy(Request $request, CalendarEvent $calendarEvent): JsonResponse
    {
        abort_unless((int) $calendarEvent->user_id === (int) $request->user()->id, 403);

        $calendarEvent->delete();

        return response()->json(['message' => 'Calendar event deleted successfully.']);
    }

    public function reminders(Request $request): JsonResponse
    {
        $now = now();
        $startOfDay = $now->copy()->startOfDay();
        $endOfDay = $now->copy()->endOfDay();
        $statuses = ['scheduled', 'pending'];

        $todayEvents = CalendarEvent::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', $statuses)
            ->whereBetween('start_at', [$startOfDay, $endOfDay])
            ->orderBy('start_at')
            ->get()
            ->map(fn (CalendarEvent $event) => $this->payload($event));

        $dueEvents = CalendarEvent::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', $statuses)
            ->where('start_at', '<=', $now)
            ->where('end_at', '>=', $now->copy()->subMinutes(1))
            ->orderBy('start_at')
            ->get()
            ->map(fn (CalendarEvent $event) => $this->payload($event));

        return response()->json([
            'today' => $todayEvents,
            'due' => $dueEvents,
            'server_time' => $now->toIso8601String(),
        ]);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'color' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', Rule::in(['scheduled', 'pending', 'completed', 'cancelled'])],
        ]);

        $data['color'] = $data['color'] ?? '#1976d2';
        $data['status'] = $data['status'] ?? 'scheduled';

        return $data;
    }

    private function payload(?CalendarEvent $event): ?array
    {
        if (! $event) {
            return null;
        }

        return [
            'id' => $event->id,
            'title' => $event->title,
            'description' => $event->description,
            'start' => $event->start_at?->format('Y-m-d\TH:i:s'),
            'end' => $event->end_at?->format('Y-m-d\TH:i:s'),
            'start_at' => $event->start_at?->format('Y-m-d\TH:i'),
            'end_at' => $event->end_at?->format('Y-m-d\TH:i'),
            'color' => $event->color ?: '#1976d2',
            'status' => $event->status,
            'extendedProps' => [
                'description' => $event->description,
                'status' => $event->status,
                'start_at' => $event->start_at?->format('Y-m-d\TH:i'),
                'end_at' => $event->end_at?->format('Y-m-d\TH:i'),
            ],
        ];
    }
}
