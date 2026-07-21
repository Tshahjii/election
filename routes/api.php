<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarEventController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\UserAccessController;
use App\Http\Controllers\UrbanElectionController;
use App\Http\Controllers\RuralElectionController;
use App\Http\Controllers\DistrictConfigController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('send-otp', [AuthController::class, 'sendOtp'])->middleware('throttle:5,1');
    Route::post('verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
    Route::get('login-config', [AuthController::class, 'getLoginConfig']);

    Route::middleware('jwt')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('unlock', [AuthController::class, 'unlock']);
        Route::post('unlock-send-otp', [AuthController::class, 'unlockSendOtp'])->middleware('throttle:5,1');
        Route::post('unlock-verify-otp', [AuthController::class, 'unlockVerifyOtp'])->middleware('throttle:10,1');
        Route::get('auth-settings', [AuthController::class, 'getAuthSettings']);
        Route::post('auth-settings', [AuthController::class, 'updateAuthSettings']);
    });
});

Route::middleware('jwt')->prefix('masters')->group(function () {
    Route::get('options', [MasterDataController::class, 'options']);
    Route::get('search', [MasterDataController::class, 'search']);
    Route::get('employees/search', [MasterDataController::class, 'searchEmployees']);
    Route::get('election-salary-rules', [MasterDataController::class, 'getSalaryRules']);
    Route::post('election-salary-rules', [MasterDataController::class, 'saveSalaryRules']);
    Route::get('{type}', [MasterDataController::class, 'index']);
    Route::post('{type}/import', [MasterDataController::class, 'import']);
    Route::post('{type}', [MasterDataController::class, 'store']);
    Route::post('{type}/{id}', [MasterDataController::class, 'update']);
    Route::delete('{type}/{id}', [MasterDataController::class, 'destroy']);
});

Route::middleware('jwt')->prefix('district-config')->group(function () {
    Route::get('/', [DistrictConfigController::class, 'getConfigs']);
    Route::post('/', [DistrictConfigController::class, 'saveConfig']);
});

Route::middleware('jwt')->prefix('urban-election')->group(function () {
    Route::get('dashboard-data', [UrbanElectionController::class, 'dashboardData']);
    Route::post('create-teams-scheduled', [UrbanElectionController::class, 'createTeamsScheduled']);
    Route::post('save-assignments', [UrbanElectionController::class, 'saveAssignments']);
    Route::post('exempt-employee', [UrbanElectionController::class, 'exemptEmployee']);
    Route::get('exempt-employee-logs', [UrbanElectionController::class, 'getExemptEmployeeLogs']);
    Route::post('restore-exempt-employee', [UrbanElectionController::class, 'restoreExemptEmployee']);
    Route::post('apply-duty', [UrbanElectionController::class, 'applyDuty']);
    Route::post('apply-targeted-duty', [UrbanElectionController::class, 'applyTargetedDuty']);
});

Route::middleware('jwt')->prefix('rural-election')->group(function () {
    Route::get('dashboard-data', [RuralElectionController::class, 'dashboardData']);
    Route::post('create-teams-scheduled', [RuralElectionController::class, 'createTeamsScheduled']);
    Route::post('save-assignments', [RuralElectionController::class, 'saveAssignments']);
    Route::post('exempt-employee', [RuralElectionController::class, 'exemptEmployee']);
    Route::post('apply-duty', [RuralElectionController::class, 'applyDuty']);
    Route::post('apply-targeted-duty', [RuralElectionController::class, 'applyTargetedDuty']);
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
