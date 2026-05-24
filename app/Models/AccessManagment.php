<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessManagment extends Model
{
    protected $fillable = [
        'user_id',
        'emp_type',
        'department',
        'designation',
        'ofc_id',
        'ofc_code',
        'country_id',
        'state_id',
        'district_id',
        'country_ids',
        'state_ids',
        'district_ids',
        'office_ids',
        'permissions',
        'can_create',
        'can_edit',
        'can_delete',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'permissions' => 'array',
        'can_create' => 'boolean',
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'district_id' => 'integer',
        'ofc_id' => 'integer',
    ];
}
