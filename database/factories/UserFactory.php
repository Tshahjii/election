<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_code' => fake()->unique()->bothify('USR-####'),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'mobile' => fake()->unique()->numerify('9#########'),
            'user_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'emp_type' => 'Permanent',
            'department' => 'Election Office',
            'designation' => 'Staff',
            'country_id' => 1,
            'state_id' => 5,
            'district_id' => 1,
            'role' => 3,
            'is_active' => 1,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_verified_at' => null,
        ]);
    }
}
