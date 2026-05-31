<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterCountry extends Model
{
    protected $fillable = [
        'name',
        'attachment_path',
        'status',
        'created_by',
        'updated_by',
    ];
}
