<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'user_code',
    'name',
    'email',
    'mobile',
    'user_verified_at',
    'password',
    'password_changed_at',
    'emp_type',
    'department',
    'designation',
    'ofc_id',
    'ofc_code',
    'country_id',
    'state_id',
    'district_id',
    'address',
    'role',
    'is_active',
    'last_active',
    'last_active_ip',
    'created_by',
    'updated_by',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_verified_at' => 'datetime',
            'last_active' => 'datetime',
            'password_changed_at' => 'datetime',
            'password' => 'hashed',
            'country_id' => 'integer',
            'state_id' => 'integer',
            'district_id' => 'integer',
            'ofc_id' => 'integer',
        ];
    }

    public function accessManagment(): HasOne
    {
        return $this->hasOne(AccessManagment::class);
    }

    public function calendarEvents(): HasMany
    {
        return $this->hasMany(CalendarEvent::class);
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

    public function office(): BelongsTo
    {
        return $this->belongsTo(MasterOffice::class, 'ofc_id', 'ofc_id');
    }

    public function passwordHistories(): HasMany
    {
        return $this->hasMany(PasswordHistory::class);
    }
}
