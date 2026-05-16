<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'mobile', 'otp', 'verified_at', 'is_active'])]
class CheckOtp extends Model
{
}
