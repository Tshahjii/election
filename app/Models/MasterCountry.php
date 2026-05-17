<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterCountry extends Model
{
    protected $fillable = [
        'name',
        'iso2',
        'iso3',
        'phone_code',
        'currency',
        'currency_symbol',
        'nationality',
        'attachment_path',
        'status',
        'created_by',
        'updated_by',
    ];
}
