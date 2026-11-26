<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

Artisan::command('billtrack:create-admin {email}', function () {
    $email = strtolower(trim($this->argument('email')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
        $this->error('Email không hợp lệ.');
        return 1;
    }
    if (DB::table('users')->where('email', $email)->exists()) {
        $this->error('Email đã tồn tại. Hãy dùng địa chỉ khác.');
        return 1;
    }
    $name = trim((string) $this->ask('Họ và tên'));
    $password = $this->secret('Mật khẩu (từ 12 ký tự)');
    $confirmation = $this->secret('Nhập lại mật khẩu');
    if ($name === '' || mb_strlen($name) > 150 || !is_string($password) ||
        mb_strlen($password) < 12 || strlen($password) > 72 || $password !== $confirmation) {
        $this->error('Tên hoặc mật khẩu không hợp lệ.');
        return 1;
    }
    DB::table('users')->insert([
        'full_name' => $name,
        'email' => $email,
        'password' => Hash::make($password),
        'role' => 'admin',
        'is_active' => 1,
        'ical_token' => Str::random(64),
    ]);
    $this->info('Đã tạo tài khoản quản trị.');
    return 0;
})->purpose('Tạo tài khoản quản trị BillTrack');
