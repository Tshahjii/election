<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome');

Route::view('/{any}', 'welcome')->where('any', '^(?!api|build|storage|vendor|assets).*$');
