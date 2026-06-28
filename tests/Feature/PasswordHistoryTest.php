<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PasswordHistory;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordHistoryTest extends TestCase
{
    use RefreshDatabase;

    private JwtService $jwt;

    protected function setUp(): void
    {
        parent::setUp();
        $this->jwt = $this->app->make(JwtService::class);
        $this->seedLocations();
    }

    private function seedLocations(): void
    {
        \Illuminate\Support\Facades\DB::table('master_countries')->insert([
            'id' => 1,
            'name' => 'India',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        \Illuminate\Support\Facades\DB::table('master_states')->insert([
            'id' => 5,
            'country_id' => 1,
            'name' => 'Delhi',
            'state_code' => 'DL',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        \Illuminate\Support\Facades\DB::table('master_districts')->insert([
            'id' => 1,
            'country_id' => 1,
            'state_id' => 5,
            'name' => 'New Delhi',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function getAuthHeader(User $user): array
    {
        $token = $this->jwt->makeToken($user->id);
        return ['Authorization' => 'Bearer ' . $token];
    }

    public function test_user_creation_saves_password_to_history(): void
    {
        $admin = User::factory()->create([
            'role' => 1, // Super Admin
        ]);

        $headers = $this->getAuthHeader($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'mobile' => '9876543210',
            'emp_type' => 'Permanent',
            'department' => 'Election Office',
            'designation' => 'Operator',
            'country_id' => 1,
            'state_id' => 5,
            'district_id' => 1,
            'password' => 'Admin@123',
            'role' => 3,
            'is_active' => 1,
        ], $headers);

        $response->assertStatus(201);
        
        $createdUser = User::where('email', 'john@example.com')->first();
        $this->assertNotNull($createdUser);
        
        // Assert password history contains the password
        $this->assertCount(1, $createdUser->passwordHistories);
        $this->assertTrue(Hash::check('Admin@123', $createdUser->passwordHistories->first()->password));
    }

    public function test_user_update_saves_password_to_history_only_if_changed(): void
    {
        $admin = User::factory()->create([
            'role' => 1, // Super Admin
        ]);

        $user = User::factory()->create([
            'email' => 'user@example.com',
            'created_by' => $admin->id,
        ]);

        $headers = $this->getAuthHeader($admin);

        // Update other fields, no password
        $response = $this->putJson("/api/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => 'user@example.com',
            'mobile' => $user->mobile,
            'emp_type' => 'Permanent',
            'department' => 'Election Office',
            'designation' => 'Operator',
            'country_id' => 1,
            'state_id' => 5,
            'district_id' => 1,
            'role' => 3,
            'is_active' => 1,
        ], $headers);

        $response->assertStatus(200);
        $this->assertCount(0, $user->fresh()->passwordHistories);

        // Update with new password
        $response2 = $this->putJson("/api/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => 'user@example.com',
            'mobile' => $user->mobile,
            'emp_type' => 'Permanent',
            'department' => 'Election Office',
            'designation' => 'Operator',
            'country_id' => 1,
            'state_id' => 5,
            'district_id' => 1,
            'password' => 'NewSecurePassword123!',
            'role' => 3,
            'is_active' => 1,
        ], $headers);

        $response2->assertStatus(200);
        $this->assertCount(1, $user->fresh()->passwordHistories);
        $this->assertTrue(Hash::check('NewSecurePassword123!', $user->fresh()->passwordHistories()->first()->password));
    }

    public function test_password_reset_saves_password_to_history(): void
    {
        $admin = User::factory()->create([
            'role' => 1, // Super Admin
        ]);

        $user = User::factory()->create([
            'created_by' => $admin->id,
        ]);

        $headers = $this->getAuthHeader($admin);

        $response = $this->postJson("/api/users/reset/{$user->id}", [], $headers);
        $response->assertStatus(200);

        $this->assertCount(1, $user->fresh()->passwordHistories);
        $this->assertTrue(Hash::check('Admin@123', $user->fresh()->passwordHistories()->first()->password));
    }

    public function test_user_cannot_reuse_any_of_the_last_5_passwords(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('PasswordOne1!'),
            'role' => 3,
        ]);

        // Put initial password in history
        $user->passwordHistories()->create(['password' => Hash::make('PasswordOne1!')]);

        $headers = $this->getAuthHeader($user);

        // Change to PasswordTwo1!
        $response = $this->postJson('/api/auth/change-password', [
            'old_password' => 'PasswordOne1!',
            'password' => 'PasswordTwo1!',
            'password_confirmation' => 'PasswordTwo1!',
        ], $headers);
        $response->assertStatus(200);

        // Change to PasswordThree1!
        $response = $this->postJson('/api/auth/change-password', [
            'old_password' => 'PasswordTwo1!',
            'password' => 'PasswordThree1!',
            'password_confirmation' => 'PasswordThree1!',
        ], $headers);
        $response->assertStatus(200);

        // Change to PasswordFour1!
        $response = $this->postJson('/api/auth/change-password', [
            'old_password' => 'PasswordThree1!',
            'password' => 'PasswordFour1!',
            'password_confirmation' => 'PasswordFour1!',
        ], $headers);
        $response->assertStatus(200);

        // Change to PasswordFive1!
        $response = $this->postJson('/api/auth/change-password', [
            'old_password' => 'PasswordFour1!',
            'password' => 'PasswordFive1!',
            'password_confirmation' => 'PasswordFive1!',
        ], $headers);
        $response->assertStatus(200);

        // Change to PasswordSix1!
        $response = $this->postJson('/api/auth/change-password', [
            'old_password' => 'PasswordFive1!',
            'password' => 'PasswordSix1!',
            'password_confirmation' => 'PasswordSix1!',
        ], $headers);
        $response->assertStatus(200);

        // Now, we have 6 passwords in history.
        // The history (latest first) has: PasswordSix1!, PasswordFive1!, PasswordFour1!, PasswordThree1!, PasswordTwo1!, PasswordOne1!.
        // Let's assert that there are 6 history entries.
        $this->assertEquals(6, $user->passwordHistories()->count());

        // Trying to change to PasswordFive1! (which is in the last 5) should FAIL.
        $responseFail = $this->postJson('/api/auth/change-password', [
            'old_password' => 'PasswordSix1!',
            'password' => 'PasswordFive1!',
            'password_confirmation' => 'PasswordFive1!',
        ], $headers);
        $responseFail->assertStatus(422);
        $responseFail->assertJsonValidationErrors(['password']);

        // Trying to change to PasswordOne1! (which is the 6th oldest, i.e., outside the last 5) should SUCCEED.
        $responseSuccess = $this->postJson('/api/auth/change-password', [
            'old_password' => 'PasswordSix1!',
            'password' => 'PasswordOne1!',
            'password_confirmation' => 'PasswordOne1!',
        ], $headers);
        $responseSuccess->assertStatus(200);
    }
}
