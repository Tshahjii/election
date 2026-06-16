<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarEventController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\UserAccessController;
use App\Http\Controllers\UrbanElectionController;
use App\Http\Controllers\RuralElectionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('send-otp', [AuthController::class, 'sendOtp'])->middleware('throttle:5,1');
    Route::post('verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');

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
    Route::get('employees/search', [MasterDataController::class, 'searchEmployees']);
    Route::get('{type}', [MasterDataController::class, 'index']);
    Route::post('{type}', [MasterDataController::class, 'store']);
    Route::post('{type}/{id}', [MasterDataController::class, 'update']);
    Route::delete('{type}/{id}', [MasterDataController::class, 'destroy']);
});

Route::middleware('jwt')->prefix('urban-election')->group(function () {
    Route::get('dashboard-data', [UrbanElectionController::class, 'dashboardData']);
    Route::post('create-teams-scheduled', [UrbanElectionController::class, 'createTeamsScheduled']);
    Route::post('save-assignments', [UrbanElectionController::class, 'saveAssignments']);
    Route::post('apply-duty', [UrbanElectionController::class, 'applyDuty']);
});

Route::middleware('jwt')->prefix('rural-election')->group(function () {
    Route::get('dashboard-data', [RuralElectionController::class, 'dashboardData']);
    Route::post('create-teams-scheduled', [RuralElectionController::class, 'createTeamsScheduled']);
    Route::post('save-assignments', [RuralElectionController::class, 'saveAssignments']);
    Route::post('apply-duty', [RuralElectionController::class, 'applyDuty']);
});

Route::middleware('jwt')->prefix('users')->group(function () {
    Route::get('access-options', [UserAccessController::class, 'accessOptions']);
    Route::post('reset/{id}', [UserAccessController::class, 'resetPassword']);
    Route::get('/', [UserAccessController::class, 'index']);
    Route::post('/', [UserAccessController::class, 'store']);
    Route::put('{user}', [UserAccessController::class, 'update']);
    Route::put('{user}/access', [UserAccessController::class, 'updateAccess']);
    Route::delete('{user}', [UserAccessController::class, 'destroy']);
});

Route::middleware('jwt')->prefix('calendar-events')->group(function () {
    Route::get('/', [CalendarEventController::class, 'index']);
    Route::get('reminders', [CalendarEventController::class, 'reminders']);
    Route::post('/', [CalendarEventController::class, 'store']);
    Route::put('{calendarEvent}', [CalendarEventController::class, 'update']);
    Route::delete('{calendarEvent}', [CalendarEventController::class, 'destroy']);
});
