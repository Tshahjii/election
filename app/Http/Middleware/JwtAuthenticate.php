<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class JwtAuthenticate
{
    public function __construct(private readonly JwtService $jwt)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        try {
            $payload = $this->jwt->decode($token);
            $user = User::query()
                ->whereKey($payload['sub'] ?? null)
                ->where('is_active', 1)
                ->first();

            if ($user && isset($payload['jti'])) {
                $cachedJti = \Illuminate\Support\Facades\Cache::get("user_active_jti_{$user->id}");
                if ($cachedJti && $cachedJti !== $payload['jti']) {
                    return response()->json(['message' => 'Session expired. You have been logged in from another device.'], 401);
                }
            }
        } catch (Throwable) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
