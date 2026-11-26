@extends('admin.shell')
@section('title', $config['title'])

@php
    $labels = [
        'role' => ['admin' => 'Quản trị', 'user' => 'Người dùng'],
        'active' => ['1' => 'Đang hoạt động', '0' => 'Đã vô hiệu hóa'],
        'locked' => ['1' => 'Đang khóa', '0' => 'Đang mở'],
        'trial' => ['1' => 'Dùng thử', '0' => '—'],
        'hike' => ['1' => 'Tăng giá', '0' => '—'],
        'type' => ['card' => 'Thẻ', 'bank' => 'Ngân hàng', 'ewallet' => 'Ví điện tử'],
        'cycle' => ['weekly' => 'Hằng tuần', 'monthly' => 'Hằng tháng', 'quarterly' => 'Hằng quý', 'yearly' => 'Hằng năm', 'custom' => 'Tùy chỉnh'],
        'mode' => ['equal' => 'Chia đều', 'custom' => 'Tùy chỉnh'],
        'source' => ['manual' => 'Thủ công', 'ai_text' => 'AI văn bản', 'ai_ocr' => 'AI OCR', 'email_text' => 'Văn bản email', 'receipt_image' => 'Ảnh hóa đơn'],
        'status' => $config['filter'][1],
    ];
    $badges = ['role', 'active', 'locked', 'trial', 'hike', 'status'];
@endphp

@section('content')
<p class="muted dataset-description">{{ $config['description'] }}</p>
<section class="panel">
    <header><h2>Danh sách</h2><span class="record-count">{{ number_format($rows->total(), 0, ',', '.') }} bản ghi</span></header>
    <form class="search dataset-search" method="get" action="{{ route('dataset', $section) }}">
        <input name="q" type="search" aria-label="Tìm bản ghi" placeholder="Tìm bản ghi" value="{{ $search }}" maxlength="160">
        <select name="filter" aria-label="Bộ lọc">
            <option value="">Tất cả</option>
            @foreach ($config['filter'][1] as $key => $label)
                <option value="{{ $key }}" @selected($filter === $key)>{{ $label }}</option>
            @endforeach
        </select>
        <button>Lọc dữ liệu</button>
        @if ($search !== '' || $filter !== '') <a href="{{ route('dataset', $section) }}">Xóa lọc</a> @endif
    </form>
    <div class="table-wrap" tabindex="0" aria-label="Bảng {{ $config['title'] }}" role="region">
        <table>
            <thead><tr>@foreach ($config['columns'] as [$label]) <th scope="col">{{ $label }}</th> @endforeach</tr></thead>
            <tbody>
            @forelse ($rows as $row)
                <tr>
                @foreach (array_keys($config['columns']) as $field)
                    @php
                        $raw = $row->{$field};
                        $string = (string) $raw;
                        $value = match (true) {
                            $raw === null || $raw === '' => '—',
                            isset($labels[$field][$string]) => $labels[$field][$string],
                            $field === 'amount_vnd' => number_format($raw, 0, ',', '.').' ₫',
                            in_array($field, ['amount', 'previous'], true) => rtrim(rtrim(number_format($raw, 4, ',', '.'), '0'), ','),
                            $field === 'ending' => '•••• '.$raw,
                            in_array($field, ['due', 'created', 'paid_at'], true) => \Illuminate\Support\Carbon::parse($raw)->format($field === 'due' ? 'd/m/Y' : 'd/m/Y H:i'),
                            default => $raw,
                        };
                        $positive = ($field === 'active' && $string === '1') || ($field === 'locked' && $string === '0')
                            || ($field === 'status' && in_array($string, ['active', 'paid', 'processed'], true));
                        $attention = ($field === 'hike' && $string === '1') || ($field === 'locked' && $string === '1')
                            || ($field === 'status' && in_array($string, ['failed', 'unpaid', 'expired'], true));
                    @endphp
                    <td>@if (in_array($field, $badges, true) && $value !== '—')
                        <span @class(['badge', 'active' => $positive, 'attention' => $attention])>{{ $value }}</span>
                    @else {{ $value }} @endif</td>
                @endforeach
                </tr>
            @empty
                <tr><td class="empty" colspan="{{ count($config['columns']) }}">Không có bản ghi phù hợp.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    @include('admin.pagination')
</section>
@endsection
