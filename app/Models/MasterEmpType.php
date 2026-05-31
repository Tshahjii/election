<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterEmpType extends Model
{
    protected $fillable = [
        'emp_type',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'integer',
    ];
}
