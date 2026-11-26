@extends('admin.shell')
@section('title', $config['title'])

@section('content')
<div class="page-actions"><a class="primary" href="{{ route('catalog', [$section, 'edit' => 'new']) }}">+ Thêm mới</a></div>
@if ($edit !== null)
<section class="panel edit-panel">
    <header><h2>{{ $record ? 'Chỉnh sửa' : 'Thêm mới' }}</h2><a href="{{ route('catalog', $section) }}">Đóng</a></header>
    <form class="fields editor" method="post" action="{{ route('catalog.save', $section) }}">
        @csrf
        <input type="hidden" name="id" value="{{ $record->id ?? '' }}">
        @foreach ($config['fields'] as $field => [$label, $type])
            @php
                $value = $record?->{$field} ?? ($config['fields'][$field][2] ?? '');
                if ($type === 'datetime-local') {
                    $value = $value ? str_replace(' ', 'T', substr($value, 0, 16)) : now()->format('Y-m-d\TH:i');
                }
                $value = old($field, $value);
            @endphp
            @if ($type === 'plans')
                <div class="wide">
                    <label for="plans-json">{{ $label }}</label>
                    <div data-plan-list></div>
                    <button type="button" data-add-plan hidden>+ Thêm gói cước</button>
                    <textarea id="plans-json" name="{{ $field }}" rows="3" data-plan-source>{{ $value }}</textarea>
                </div>
            @else
                <label @class(['wide' => $type === 'textarea'])>{{ $label }}
                    @if ($type === 'category' || $type === 'status')
                        <select name="{{ $field }}" required>
                            <option value="">Chọn {{ mb_strtolower($label) }}</option>
                            @foreach ($type === 'category' ? $categories : [1 => 'Đang mở', 0 => 'Đã ẩn'] as $key => $option)
                                <option value="{{ $key }}" @selected((string) $value === (string) $key)>{{ $option }}</option>
                            @endforeach
                        </select>
                    @elseif ($type === 'textarea')
                        <textarea name="{{ $field }}" rows="3">{{ $value }}</textarea>
                    @else
                        <input name="{{ $field }}" value="{{ $value }}" type="{{ $type === 'decimal' ? 'number' : $type }}"
                            @if ($type === 'decimal') step="0.0001" min="0.0001" @endif @if ($type !== 'url') required @endif>
                    @endif
                </label>
            @endif
        @endforeach
        <div class="wide"><button class="primary">Lưu thay đổi</button> <a class="secondary" href="{{ route('catalog', $section) }}">Hủy</a></div>
    </form>
</section>
@endif
<section class="panel">
    <form class="search" method="get" action="{{ route('catalog', $section) }}">
        <input name="q" type="search" aria-label="Tìm theo tên hoặc mã" placeholder="Tìm theo tên hoặc mã" value="{{ $search }}">
        <button>Tìm kiếm</button>
        @if ($search !== '') <a href="{{ route('catalog', $section) }}">Xóa lọc</a> @endif
    </form>
    <div class="table-wrap">
        <table>
            <thead><tr>@foreach ($config['columns'] as $label)<th scope="col">{{ $label }}</th>@endforeach<th scope="col">Thao tác</th></tr></thead>
            <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach (array_keys($config['columns']) as $field)
                        <td>
                        @if ($field === 'is_active') <span @class(['badge', 'active' => $row->is_active])>{{ $row->is_active ? 'Đang mở' : 'Đã ẩn' }}</span>
                        @elseif ($field === 'category_id') {{ $categories[$row->category_id] ?? '—' }}
                        @else {{ $row->{$field} }}
                        @endif
                        </td>
                    @endforeach
                    <td><div class="actions">
                        <a href="{{ route('catalog', [$section, 'edit' => $row->id]) }}">Sửa</a>
                        <form method="post" action="{{ route('catalog.delete', [$section, $row->id]) }}" data-confirm>
                            @csrf @method('DELETE')<button class="danger">Xóa</button>
                        </form>
                    </div></td>
                </tr>
            @empty
                <tr><td class="empty" colspan="{{ count($config['columns']) + 1 }}">Không có bản ghi.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    @include('admin.pagination')
</section>
@endsection
