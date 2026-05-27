<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application Error</title>
    <style>
        :root {
            color-scheme: light dark;
            --bg: #f4f6f8;
            --paper: #ffffff;
            --text: #1f2937;
            --muted: #667085;
            --primary: #24527a;
            --border: #d7dee8;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #08111f;
                --paper: #111c2e;
                --text: #eef4ff;
                --muted: #aebbd0;
                --primary: #8bbcff;
                --border: #243246;
            }
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--text);
        }

        main {
            width: min(560px, 100%);
            padding: 32px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--paper);
            box-shadow: 0 18px 48px rgba(0, 0, 0, 0.12);
            text-align: center;
        }

        .code {
            display: inline-grid;
            place-items: center;
            min-width: 72px;
            height: 40px;
            padding: 0 14px;
            margin-bottom: 18px;
            border-radius: 999px;
            background: color-mix(in srgb, var(--primary) 12%, transparent);
            color: var(--primary);
            font-weight: 700;
        }

        h1 {
            margin: 0 0 10px;
            font-size: clamp(24px, 4vw, 34px);
            line-height: 1.2;
        }

        p {
            margin: 0 0 24px;
            color: var(--muted);
            line-height: 1.6;
        }

        a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 42px;
            padding: 0 18px;
            border-radius: 6px;
            background: var(--primary);
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <main>
        <div class="code">{{ $status ?? 500 }}</div>
        <h1>Unable to load this page</h1>
        <p>{{ $message ?? 'Something went wrong. Please try again later.' }}</p>
        <a href="{{ url('/') }}">Go to login</a>
    </main>
</body>
</html>
