<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterDesignation extends Model
{
    protected $fillable = [
        'designation',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'integer',
    ];
}
