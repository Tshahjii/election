<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterNPWard extends Model
{
    protected $table = 'master_np_wards';

    protected $fillable = [
        'state_id',
        'district_id',
        'city_id',
        'ward_no',
        'ward_name',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'state_id' => 'integer',
        'district_id' => 'integer',
        'city_id' => 'integer',
        'ward_no' => 'integer',
        'status' => 'integer',
    ];
}
