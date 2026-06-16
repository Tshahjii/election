<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ruralCityId = Illuminate\Support\Facades\DB::table('master_rp_cities')->value('id');
$urbanCityId = Illuminate\Support\Facades\DB::table('master_np_cities')->value('id');
$requestRural = Illuminate\Http\Request::create('/', 'GET', ['city_id' => $ruralCityId]);
$requestUrban = Illuminate\Http\Request::create('/', 'GET', ['city_id' => $urbanCityId]);

try {
    if ($ruralCityId) {
        $rural = (new \App\Http\Controllers\RuralElectionController())->dashboardData($requestRural);
        echo "RURAL (city_id={$ruralCityId}):\n";
        echo $rural->getContent() . "\n\n";
    } else {
        echo "RURAL: no rural city found in DB\n\n";
    }
} catch (Throwable $e) {
    echo "RURAL ERROR: " . $e->getMessage() . "\n\n";
}

try {
    if ($urbanCityId) {
        $urban = (new \App\Http\Controllers\UrbanElectionController())->dashboardData($requestUrban);
        echo "URBAN (city_id={$urbanCityId}):\n";
        echo $urban->getContent() . "\n";
    } else {
        echo "URBAN: no urban city found in DB\n";
    }
} catch (Throwable $e) {
    echo "URBAN ERROR: " . $e->getMessage() . "\n";
}
