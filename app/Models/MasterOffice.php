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
        'district',
        'state',
        'country',
        'attachment_path',
        'created_by',
        'updated_by',
    ];
}
