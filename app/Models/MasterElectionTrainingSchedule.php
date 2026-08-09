<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterElectionTrainingSchedule extends Model
{
    protected $fillable = [
        'district_id',
        'election_type',
        'purpose',
        'date',
        'time',
        'venue',
        'sort_order',
    ];
}
