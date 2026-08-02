<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DistrictElectionSalaryRule extends Model
{
    protected $table = 'district_election_salary_rules';

    protected $fillable = [
        'district_id',
        'post_name',
        'min_salary',
        'comparison_operator',
        'designation_ids',
    ];

    protected $casts = [
        'designation_ids' => 'array',
    ];

    public function district(): BelongsTo
    {
        return $this->belongsTo(MasterDistrict::class, 'district_id');
    }
}
