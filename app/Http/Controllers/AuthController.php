<?php

namespace App\Http\Controllers;

use App\Models\CheckOtp;
use App\Models\MasterCountry;
use App\Models\MasterDistrict;
use App\Models\MasterOffice;
use App\Models\MasterState;
use App\Models\User;
use App\Services\JwtService;
use App\Services\TurnstileService;
use App\Support\AccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
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

        if ($otpCount >= 50) {
            throw ValidationException::withMessages([
                'mobile' => 'OTP limit reached. You can request only 50 OTPs in 24 hours.'
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

        Log::info('Login OTP generated.', ['mobile' => $user->mobile]);

        return response()->json([
            'message' => 'OTP sent successfully.',
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

        if (Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'New password must be different from the old password.'
            ]);
        }

        // Check password history (last 5 passwords)
        $passwordHistories = $user->passwordHistories()->latest('id')->take(5)->get();
        foreach ($passwordHistories as $history) {
            if (Hash::check($data['password'], $history->password)) {
                throw ValidationException::withMessages([
                    'password' => 'New password cannot be same as any of your last 5 passwords.'
                ]);
            }
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
            'password_changed_at' => now(),
        ])->save();

        $user->passwordHistories()->create([
            'password' => $user->password,
        ]);

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
        $user->loadMissing('accessManagment');
        $access = AccessScope::payload($user);
        $office = MasterOffice::query()
            ->where('ofc_id', $user->ofc_id)
            ->first(['ofc_id', 'office_code', 'office_name', 'company_name', 'country_id', 'state_id', 'district_id']);
        $stateId = $user->state_id ?: $office?->state_id ?: collect($access['state_ids'] ?? [])->first();
        $officeCodeParts = explode('-', (string) ($office?->office_code ?: $user->ofc_code));
        $stateCode = count($officeCodeParts) > 1 ? end($officeCodeParts) : null;
        $state = ($stateId || $stateCode) ? MasterState::query()
            ->when($stateId, fn ($query) => $query->where('id', $stateId))
            ->when(! $stateId && $stateCode, fn ($query) => $query->where('state_code', $stateCode))
            ->first(['id', 'name', 'state_code', 'attachment_path']) : null;
        $country = MasterCountry::query()->whereKey($user->country_id ?: $office?->country_id)->first(['id', 'name']);
        $district = MasterDistrict::query()->whereKey($user->district_id ?: $office?->district_id)->first(['id', 'name']);
        $isDefaultPassword = Hash::check('Admin@123', $user->password);
        $passwordChangedAt = $user->password_changed_at ?: $user->created_at;
        $isPasswordExpired = ! $passwordChangedAt || $passwordChangedAt->lte(now()->subDays(7));

        $data['must_change_password'] = $isDefaultPassword || $isPasswordExpired;
        $data['password_change_reason'] = $isDefaultPassword ? 'default' : ($isPasswordExpired ? 'expired' : null);
        $data['password_expires_at'] = $passwordChangedAt ? $passwordChangedAt->copy()->addDays(7)->toISOString() : null;
        $data['access'] = $access;
        $data['office_info'] = $office ? [
            'ofc_id' => $office->ofc_id,
            'office_code' => $office->office_code,
            'office_name' => $office->office_name,
            'company_name' => $office->company_name,
            'district_id' => $office->district_id,
            'district' => $district?->name,
            'state_id' => $office->state_id,
            'state' => $state?->name,
            'country_id' => $office->country_id,
            'country' => $country?->name,
        ] : null;
        $data['country_info'] = $country ? [
            'id' => $country->id,
            'name' => $country->name,
        ] : null;
        $data['state_info'] = $state ? [
            'id' => $state->id,
            'name' => $state->name,
            'state_code' => $state->state_code,
            'logo_url' => $this->assetUrl($state->attachment_path),
        ] : null;
        $data['district_info'] = $district ? [
            'id' => $district->id,
            'name' => $district->name,
        ] : null;

        return $data;
    }

    private function assetUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_contains($path, '/storage/')) {
            $path = substr($path, strpos($path, '/storage/') + strlen('/storage/'));
        }

        $normalizedPath = ltrim(str_replace(['/storage/', 'storage/'], '', $path), '/');

        if (str_starts_with($normalizedPath, 'http://') || str_starts_with($normalizedPath, 'https://')) {
            return null;
        }

        return Storage::disk('uploads')->url($normalizedPath);
    }

    private function markInactiveIfLoginExpired(User $user): void
    {
        if ($user->last_active && $user->last_active->lt(now()->subDays(7))) {
            $user->forceFill(['is_active' => 0])->save();
            $user->refresh();
        }
    }
}
