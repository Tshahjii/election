<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterDepartment extends Model
{
    protected $fillable = [
        'department',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'integer',
    ];
}
