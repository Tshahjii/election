<?php

namespace App\Http\Controllers;

use App\Models\CheckOtp;
use App\Models\User;
use App\Services\JwtService;
use App\Services\TurnstileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const OTP_TTL_MINUTES = 2;

    public function __construct(
        private readonly JwtService $jwt,
        private readonly TurnstileService $turnstile
    ) {}

    public function sendOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mobile' => ['required', 'string', 'regex:/^[6-9][0-9]{9}$/'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('mobile', $data['mobile'])->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'mobile' => 'This mobile number is not registered.'
            ]);
        }

        $this->markInactiveIfLoginExpired($user);

        if ((int) $user->is_active !== 1) {
            throw ValidationException::withMessages([
                'mobile' => 'This account is inactive. Please contact the administrator.'
            ]);
        }

        if (!Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'The provided password is incorrect.'
            ]);
        }

        $otpCount = CheckOtp::query()
            ->where('mobile', $user->mobile)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        if ($otpCount >= 3) {
            throw ValidationException::withMessages([
                'mobile' => 'OTP limit reached. You can request only 3 OTPs in 24 hours.'
            ]);
        }

        CheckOtp::query()
            ->where('mobile', $user->mobile)
            ->where('is_active', 1)
            ->update(['is_active' => 0]);

        $otp = (string) random_int(100000, 999999);

        CheckOtp::query()->create([
            'user_id' => (string) $user->id,
            'mobile' => $user->mobile,
            'otp' => $otp,
        ]);

        Log::info('Login OTP generated.', ['mobile' => $user->mobile, 'otp' => $otp]);

        return response()->json([
            'message' => 'OTP sent successfully.',
            'otp' => app()->isLocal() ? $otp : null,
            'otp_expires_in' => self::OTP_TTL_MINUTES * 60,
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mobile' => ['required', 'string', 'regex:/^[6-9][0-9]{9}$/'],
            'otp' => ['required', 'string', 'size:6'],
            'captcha_token' => ['required', 'string', 'max:2048'],
        ]);

        if (! $this->turnstile->verify($data['captcha_token'], $request->ip())) {
            throw ValidationException::withMessages([
                'captcha_token' => 'Human verification failed. Please try again.'
            ]);
        }

        $user = User::query()->where('mobile', $data['mobile'])->first();

        if (! $user) {
            throw ValidationException::withMessages(['mobile' => 'This mobile number is not registered.']);
        }

        $this->markInactiveIfLoginExpired($user);

        if ((int) $user->is_active !== 1) {
            throw ValidationException::withMessages([
                'mobile' => 'This account is inactive. Please contact the administrator.'
            ]);
        }

        $otpExpiresAt = now()->subMinutes(self::OTP_TTL_MINUTES);

        CheckOtp::query()
            ->where('user_id', (string) $user->id)
            ->where('mobile', $data['mobile'])
            ->where('is_active', 1)
            ->whereNull('verified_at')
            ->where('created_at', '<', $otpExpiresAt)
            ->update(['is_active' => 0]);

        $otpRecord = CheckOtp::query()
            ->where('user_id', (string) $user->id)
            ->where('mobile', $data['mobile'])
            ->where('otp', $data['otp'])
            ->where('is_active', 1)
            ->whereNull('verified_at')
            ->where('created_at', '>=', $otpExpiresAt)
            ->latest()
            ->first();

        if (! $otpRecord) {
            throw ValidationException::withMessages(['otp' => 'The OTP is invalid or expired.']);
        }

        $otpRecord->forceFill([
            'verified_at' => now(),
            'is_active' => 0,
        ])->save();

        $user->forceFill([
            'user_verified_at' => $user->user_verified_at ?: now(),
            'last_active' => now(),
            'last_active_ip' => $request->ip(),
        ])->save();

        return response()->json($this->tokenResponse($user));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    public function refresh(Request $request): JsonResponse
    {
        return response()->json($this->tokenResponse($request->user()));
    }

    public function logout(): JsonResponse
    {
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'old_password' => ['required', 'string'],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[^A-Za-z0-9]/',
            ],
        ]);

        $user = $request->user();

        if (! Hash::check($data['old_password'], $user->password)) {
            throw ValidationException::withMessages([
                'old_password' => 'Old password is incorrect.'
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        return response()->json([
            'message' => 'Password changed successfully.',
            'user' => $this->userPayload($user->fresh()),
        ]);
    }

    private function tokenResponse(User $user): array
    {
        return [
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'access_token' => $this->jwt->makeToken($user->getKey()),
            'user' => $this->userPayload($user),
        ];
    }

    private function userPayload(User $user): array
    {
        $data = $user->toArray();
        $data['must_change_password'] = Hash::check('Admin@123', $user->password);

        return $data;
    }

    private function markInactiveIfLoginExpired(User $user): void
    {
        if ($user->last_active && $user->last_active->lt(now()->subDays(7))) {
            $user->forceFill(['is_active' => 0])->save();
            $user->refresh();
        }
    }
}
