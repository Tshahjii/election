<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TurnstileService
{
    public function verify(string $token, ?string $ip = null): bool
    {
        $secret = config('services.turnstile.secret_key');

        if (! $secret) {
            Log::warning('Turnstile secret key is missing.');

            return false;
        }

        $response = Http::asForm()
            ->timeout(8)
            ->post(config('services.turnstile.verify_url'), array_filter([
                'secret' => $secret,
                'response' => $token,
                'remoteip' => $ip,
            ]));

        if (! $response->ok()) {
            Log::warning('Turnstile verification request failed.', [
                'status' => $response->status(),
            ]);

            return false;
        }

        $result = $response->json();

        if (! ($result['success'] ?? false)) {
            Log::warning('Turnstile verification rejected.', [
                'errors' => $result['error-codes'] ?? [],
            ]);

            return false;
        }

        return true;
    }
}
