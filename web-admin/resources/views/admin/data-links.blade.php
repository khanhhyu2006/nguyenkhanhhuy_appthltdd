@foreach ($sections as $item)
    @php
        $catalog = config("admin.$item");
        $title = ($catalog ?? config("admin-data.$item"))['title'];
        $href = route($catalog ? 'catalog' : 'dataset', $item);
    @endphp
    @if (isset($tableCounts))
        <a class="directory-link" href="{{ $href }}"><span>{{ $title }}</span><strong>{{ number_format($tableCounts[$item], 0, ',', '.') }}</strong></a>
    @else
        <a href="{{ $href }}" @if(request()->route('section') === $item) aria-current="page" @endif>{{ $title }}</a>
    @endif
@endforeach
