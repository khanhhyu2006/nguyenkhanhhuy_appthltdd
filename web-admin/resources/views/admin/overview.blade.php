@extends('admin.shell')
@section('title', 'Tổng quan')

@section('content')
<section class="hero">
    <p>{{ now()->format('d/m/Y') }}</p>
    <h2>Lịch gia hạn</h2>
    <p>{{ $upcoming->count() }} gói trong danh sách sắp đến kỳ thanh toán.</p>
    <a href="#renewals" class="hero-link">Xem lịch gia hạn</a>
</section>
<div class="metrics">
    @foreach ($metrics as $label => $count)
        <section class="panel metric"><span>{{ $label }}</span><strong>{{ number_format($count, 0, ',', '.') }}</strong></section>
    @endforeach
</div>
<section class="directory" aria-labelledby="directory-title">
    <h2 id="directory-title">Dữ liệu hệ thống</h2>
    <div class="directory-grid">
        @foreach (config('admin-navigation') as $group => $sections)
            <section class="panel directory-group">
                <h3>{{ $group }}</h3>
                @include('admin.data-links', ['sections' => $sections])
            </section>
        @endforeach
    </div>
</section>
<div class="overview-grid">
    <section id="renewals" class="panel">
        <header><h2>Gia hạn sắp tới</h2></header>
        @forelse ($upcoming as $item)
            <div class="summary"><div><strong>{{ $item->service_name }}</strong><small>{{ $item->plan_name }}</small></div>
                <div class="amount"><strong>{{ number_format($item->amount_vnd, 0, ',', '.') }} ₫</strong>
                    <small>{{ \Illuminate\Support\Carbon::parse($item->next_billing_date)->format('d/m/Y') }}{{ $item->is_free_trial ? ' · Hết dùng thử' : '' }}</small></div></div>
        @empty <p class="empty">Chưa có gói sắp gia hạn.</p>
        @endforelse
    </section>
    <section class="panel">
        <header><h2>Tỷ giá</h2><a href="{{ route('catalog', 'rates') }}">Quản lý</a></header>
        @forelse ($rates as $rate)
            <div class="summary"><div><strong>{{ $rate->currency_code }}</strong><small>{{ $rate->source_bank }}</small></div>
                <strong class="amount">{{ rtrim(rtrim(number_format($rate->rate_to_vnd, 4, ',', '.'), '0'), ',') }} ₫</strong></div>
        @empty <p class="empty">Chưa có tỷ giá.</p>
        @endforelse
    </section>
</div>
@endsection
