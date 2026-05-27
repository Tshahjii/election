<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterCity extends Model
{
    protected $fillable = [
        'state_id',
        'district_id',
        'city_name',
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
