<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'emp_type', 'department', 'district', 'state', 'country', 'created_by', 'updated_by'])]
class AccessManagment extends Model
{
}
