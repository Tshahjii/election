<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\UserAccessController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('send-otp', [AuthController::class, 'sendOtp']);
    Route::post('verify-otp', [AuthController::class, 'verifyOtp']);

    Route::middleware('jwt')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('jwt')->prefix('masters')->group(function () {
    Route::get('options', [MasterDataController::class, 'options']);
    Route::get('search', [MasterDataController::class, 'search']);
    Route::get('{type}', [MasterDataController::class, 'index']);
    Route::post('{type}', [MasterDataController::class, 'store']);
    Route::post('{type}/{id}', [MasterDataController::class, 'update']);
    Route::delete('{type}/{id}', [MasterDataController::class, 'destroy']);
});

Route::middleware('jwt')->prefix('users')->group(function () {
    Route::get('access-options', [UserAccessController::class, 'accessOptions']);
    Route::get('/', [UserAccessController::class, 'index']);
    Route::post('/', [UserAccessController::class, 'store']);
    Route::put('{user}', [UserAccessController::class, 'update']);
    Route::put('{user}/access', [UserAccessController::class, 'updateAccess']);
    Route::delete('{user}', [UserAccessController::class, 'destroy']);
});
