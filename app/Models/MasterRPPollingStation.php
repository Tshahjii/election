<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterRPPollingStation extends Model
{
    protected $table = 'master_rp_polling_stations';

    protected $fillable = [
        'state_id',
        'district_id',
        'city_id',
        'ward_id',
        'polling_station_name',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'state_id' => 'integer',
        'district_id' => 'integer',
        'city_id' => 'integer',
        'ward_id' => 'integer',
        'status' => 'integer',
    ];
}
