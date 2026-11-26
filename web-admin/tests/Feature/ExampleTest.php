<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_administration_requires_sign_in(): void
    {
        $this->get('/')->assertRedirect(route('login'));
        $this->get('/templates')->assertRedirect(route('login'));
        $this->get('/login')->assertOk()->assertSee('Đăng nhập quản trị');
    }
}
