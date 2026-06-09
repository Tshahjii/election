<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterPayLevel extends Model
{
    protected $fillable = [
        'level',
        'min_amount_pay',
        'max_amount_pay',
        'grade_pay',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'integer',
    ];
}
