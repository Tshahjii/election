<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterOffice extends Model
{
    protected $primaryKey = 'ofc_id';

    protected $fillable = [
        'office_code',
        'office_name',
        'company_name',
        'office_type',
        'ofc_parent_id',
        'status',
        'country_id',
        'state_id',
        'district_id',
        'attachment_path',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'country_id' => 'integer',
        'state_id' => 'integer',
        'district_id' => 'integer',
        'ofc_id' => 'integer',
        'ofc_parent_id' => 'integer',
        'office_type' => 'integer',
        'status' => 'integer',
    ];
}
