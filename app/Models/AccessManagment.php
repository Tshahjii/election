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
        'district',
        'state',
        'country',
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
    ];
}
