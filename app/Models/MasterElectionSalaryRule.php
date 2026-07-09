<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterElectionSalaryRule extends Model
{
    protected $table = 'master_election_salary_rules';

    protected $fillable = [
        'post_name',
        'min_salary',
        'comparison_operator',
    ];
}
