<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DistrictElectionConfig extends Model
{
    protected $table = 'district_election_configs';

    protected $fillable = [
        'district_id',
        'dob_from',
        'dob_to',
        'same_city_duty_male',
        'same_city_duty_female',
    ];

    protected $casts = [
        'dob_from' => 'date',
        'dob_to' => 'date',
        'same_city_duty_male' => 'boolean',
        'same_city_duty_female' => 'boolean',
    ];

    public function district(): BelongsTo
    {
        return $this->belongsTo(MasterDistrict::class, 'district_id');
    }
}
