<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterNPCity extends Model
{
    protected $table = 'master_np_cities';

    protected $fillable = [
        'state_id',
        'district_id',
        'city_name',
        'karyalay_name',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'state_id' => 'integer',
        'district_id' => 'integer',
        'status' => 'integer',
    ];
}
