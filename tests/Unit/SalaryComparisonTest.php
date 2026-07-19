<?php

namespace Tests\Unit;

use App\Support\SalaryComparison;
use PHPUnit\Framework\TestCase;

class SalaryComparisonTest extends TestCase
{
    public function test_returns_safe_operator_for_above_rules(): void
    {
        $this->assertSame('>=', SalaryComparison::resolveOperator('above'));
    }

    public function test_falls_back_to_safe_operator_for_invalid_input(): void
    {
        $this->assertSame('<', SalaryComparison::resolveOperator('below'));
        $this->assertSame('<', SalaryComparison::resolveOperator('unknown'));
        $this->assertSame('<', SalaryComparison::resolveOperator(null));
    }
}
