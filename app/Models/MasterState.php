<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterState extends Model
{
    protected $fillable = [
        'country_id',
        'name',
        'state_code',
        'state_logo',
        'attachment_path',
        'status',
        'created_by',
        'updated_by',
    ];
}
