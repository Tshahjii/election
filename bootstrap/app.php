<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'jwt' => \App\Http\Middleware\JwtAuthenticate::class,
        ]);
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Request $request) {
            $status = match (true) {
                $e instanceof ValidationException => Response::HTTP_UNPROCESSABLE_ENTITY,
                $e instanceof AuthenticationException => Response::HTTP_UNAUTHORIZED,
                $e instanceof AuthorizationException => Response::HTTP_FORBIDDEN,
                $e instanceof ModelNotFoundException => Response::HTTP_NOT_FOUND,
                $e instanceof HttpExceptionInterface => (int) $e->getStatusCode(),
                default => Response::HTTP_INTERNAL_SERVER_ERROR,
            };

            if ($status >= Response::HTTP_INTERNAL_SERVER_ERROR) {
                Log::error($e->getMessage(), [
                    'exception' => $e::class,
                    'path' => $request->path(),
                ]);
            }

            if ($request->is('api/*') || $request->expectsJson()) {
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'message' => $e->getMessage() ?: 'The given data was invalid.',
                        'errors' => $e->errors(),
                        'status' => $status,
                    ], $status);
                }

                return response()->json([
                    'message' => $status >= Response::HTTP_INTERNAL_SERVER_ERROR
                        ? 'Something went wrong. Please try again later.'
                        : ($e->getMessage() ?: Response::$statusTexts[$status] ?? 'Request failed.'),
                    'status' => $status,
                ], $status);
            }

            return response()->view('errors.app', [
                'status' => $status,
                'message' => $status >= Response::HTTP_INTERNAL_SERVER_ERROR
                    ? 'Something went wrong. Please try again later.'
                    : (Response::$statusTexts[$status] ?? 'Unable to load this page.'),
            ], $status);
        });
    })->create();
