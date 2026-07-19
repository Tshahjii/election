<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExemptEmployeeLog extends Model
{
    protected $fillable = [
        'emp_code',
        'employee_id',
        'urban_post',
        'rural_post',
        'urban_mapping_id',
        'rural_mapping_id',
        'urban_reason',
        'rural_reason',
        'created_by',
    ];

    protected $casts = [
        'employee_id' => 'integer',
        'urban_mapping_id' => 'integer',
        'rural_mapping_id' => 'integer',
        'created_by' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(MasterEmployee::class, 'employee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
