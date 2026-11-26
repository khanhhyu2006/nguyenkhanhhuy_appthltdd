@extends('admin.layout')

@section('body')
<div class="shell">
    <aside class="sidebar">
        <a class="brand" href="{{ route('overview') }}"><span class="logo" aria-hidden="true">B</span> BillTrack</a>
        <nav aria-label="Quản trị">
            <a href="{{ route('overview') }}" @if(request()->routeIs('overview')) aria-current="page" @endif>Tổng quan</a>
            @foreach (config('admin-navigation') as $group => $sections)
                <div class="nav-group">
                    <p>{{ $group }}</p>
                    @include('admin.data-links', ['sections' => $sections, 'tableCounts' => null])
                </div>
            @endforeach
        </nav>
        <form method="post" action="{{ route('logout') }}">@csrf<button type="submit">Đăng xuất</button></form>
    </aside>
    <div class="workspace">
        <header class="topbar"><span>Quản trị nội dung</span><strong>{{ auth()->user()->full_name }}</strong></header>
        <main>
            <h1>@yield('title')</h1>
            @if (session('status')) <p class="status" role="status">{{ session('status') }}</p> @endif
            @include('admin.errors')
            @yield('content')
        </main>
    </div>
</div>
@endsection
