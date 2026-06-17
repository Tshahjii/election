<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MasterEmployee extends Model
{
    protected $fillable = [
        'emp_code',
        'gov_emp_code',
        'title',
        'name',
        'gender',
        'dob',
        'mobile',
        'email',
        'emp_type_id',
        'department_id',
        'designation_id',
        'ofc_id',
        'pay_level_id',
        'basic_pay',
        'country_id',
        'state_id',
        'district_id',
        'city_type',
        'city_id',
        'any_disability',
        'remark',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'gender' => 'integer',
        'emp_type_id' => 'integer',
        'department_id' => 'integer',
        'designation_id' => 'integer',
        'ofc_id' => 'integer',
        'pay_level_id' => 'integer',
        'country_id' => 'integer',
        'state_id' => 'integer',
        'district_id' => 'integer',
        'city_id' => 'integer',
        'any_disability' => 'integer',
        'status' => 'integer',
    ];

    public function employeeType(): BelongsTo
    {
        return $this->belongsTo(MasterEmpType::class, 'emp_type_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(MasterDepartment::class, 'department_id');
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(MasterDesignation::class, 'designation_id');
    }

    public function payLevel(): BelongsTo
    {
        return $this->belongsTo(MasterPayLevel::class, 'pay_level_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(MasterOffice::class, 'ofc_id', 'ofc_id');
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(MasterCountry::class, 'country_id');
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(MasterState::class, 'state_id');
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(MasterDistrict::class, 'district_id');
    }

    public function city(): BelongsTo
    {
        return $this->city_type === 'urban'
            ? $this->belongsTo(MasterNPCity::class, 'city_id')
            : $this->belongsTo(MasterRPCity::class, 'city_id');
    }
}
