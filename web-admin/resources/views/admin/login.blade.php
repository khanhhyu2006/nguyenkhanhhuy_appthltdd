@extends('admin.layout')
@section('title', 'Đăng nhập quản trị')

@section('body')
<main class="login">
    <section class="login-form">
        <div class="brand"><span class="logo" aria-hidden="true">B</span> BillTrack</div>
        <h1>Đăng nhập quản trị</h1>
        <p class="muted">Dùng tài khoản quản trị BillTrack để truy cập hệ thống.</p>
        @include('admin.errors')
        <form method="post" action="{{ route('login') }}" class="fields">
            @csrf
            <label>Email quản trị <input name="email" type="email" value="{{ old('email') }}" autocomplete="username" required maxlength="191"></label>
            <label>Mật khẩu <input name="password" type="password" autocomplete="current-password" required maxlength="255"></label>
            <button class="primary">Đăng nhập</button>
        </form>
    </section>
    <aside class="login-art"><div><strong>Quản lý gói định kỳ</strong><p>Theo dõi dịch vụ, lịch gia hạn và tỷ giá từ một trang quản trị.</p></div></aside>
</main>
@endsection
