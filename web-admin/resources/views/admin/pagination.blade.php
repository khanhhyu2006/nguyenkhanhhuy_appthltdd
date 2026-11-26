@if ($rows->hasPages())
    <nav class="pagination" aria-label="Phân trang">
        @if ($rows->previousPageUrl()) <a href="{{ $rows->previousPageUrl() }}">Trang trước</a> @endif
        <span>Trang {{ $rows->currentPage() }} / {{ $rows->lastPage() }}</span>
        @if ($rows->nextPageUrl()) <a href="{{ $rows->nextPageUrl() }}">Trang sau</a> @endif
    </nav>
@endif
