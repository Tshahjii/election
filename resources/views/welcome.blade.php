<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="turnstile-site-key" content="{{ config('services.turnstile.site_key') }}">
    <title>{{ config('app.name', 'Election Portal') }}</title>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
    @viteReactRefresh
    @vite('resources/js/app.tsx')
</head>
<body>
    <div id="root"></div>
</body>
</html>
