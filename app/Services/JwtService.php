<?php

namespace App\Services;

use Illuminate\Support\Str;
use RuntimeException;

class JwtService
{
    public function makeToken(int|string $subject, array $claims = [], ?int $ttl = null): string
    {
        $issuedAt = time();
        $expiresAt = $issuedAt + (($ttl ?? config('jwt.ttl')) * 60);

        $payload = array_merge($claims, [
            'iss' => config('app.url'),
            'sub' => (string) $subject,
            'iat' => $issuedAt,
            'nbf' => $issuedAt,
            'exp' => $expiresAt,
            'jti' => (string) Str::uuid(),
        ]);

        $header = ['typ' => 'JWT', 'alg' => config('jwt.algo', 'HS256')];
        $segments = [
            $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR)),
            $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR)),
        ];

        $segments[] = $this->sign(implode('.', $segments));

        return implode('.', $segments);
    }

    public function decode(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new RuntimeException('Token format is invalid.');
        }

        [$encodedHeader, $encodedPayload, $signature] = $parts;
        $unsignedToken = $encodedHeader.'.'.$encodedPayload;

        if (! hash_equals($this->sign($unsignedToken), $signature)) {
            throw new RuntimeException('Token signature is invalid.');
        }

        $header = json_decode($this->base64UrlDecode($encodedHeader), true, 512, JSON_THROW_ON_ERROR);

        if (($header['alg'] ?? null) !== config('jwt.algo', 'HS256')) {
            throw new RuntimeException('Token algorithm is invalid.');
        }

        $payload = json_decode($this->base64UrlDecode($encodedPayload), true, 512, JSON_THROW_ON_ERROR);
        $now = time();

        if (($payload['nbf'] ?? 0) > $now) {
            throw new RuntimeException('Token is not active yet.');
        }

        if (($payload['exp'] ?? 0) < $now) {
            throw new RuntimeException('Token has expired.');
        }

        return $payload;
    }

    private function sign(string $value): string
    {
        return $this->base64UrlEncode(hash_hmac('sha256', $value, $this->secret(), true));
    }

    private function secret(): string
    {
        $secret = config('jwt.secret');

        if (str_starts_with((string) $secret, 'base64:')) {
            return base64_decode(substr($secret, 7), true) ?: (string) $secret;
        }

        return (string) $secret;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/').str_repeat('=', (4 - strlen($value) % 4) % 4)) ?: '';
    }
}
