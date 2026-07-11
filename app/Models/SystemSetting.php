<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'system_settings';
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public static function getValue(string $key, $default = null): ?string
    {
        $setting = self::query()->find($key);
        return $setting ? $setting->value : $default;
    }

    public static function isEnabled(string $key, bool $default = false): bool
    {
        return self::getValue($key, $default ? '1' : '0') === '1';
    }
}
