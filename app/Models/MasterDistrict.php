<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterDistrict extends Model
{
    protected $fillable = [
        'country_id',
        'state_id',
        'name',
        'district_code',
        'attachment_path',
        'status',
        'created_by',
        'updated_by',
    ];
}
