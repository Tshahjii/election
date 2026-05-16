<!DOCTYPE html>
<html>
<head>
    <meta name="turnstile-site-key" content="{{ config('services.turnstile.site_key') }}">
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
    @viteReactRefresh
    @vite('resources/js/app.tsx')
</head>
<body>
    <div id="root"></div>
</body>
</html>
