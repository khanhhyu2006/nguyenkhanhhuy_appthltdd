<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function loginForm()
    {
        return $this->isAdmin() ? redirect()->route('overview') : view('admin.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email|max:191', 'password' => 'required|string|max:255']);
        if (!Auth::attempt($credentials + ['role' => 'admin', 'is_active' => 1])) {
            return back()->withInput($request->only('email'))->withErrors(['email' => 'Email hoặc mật khẩu quản trị chưa đúng.']);
        }
        $request->session()->regenerate();
        return redirect()->route('overview');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }

    public function overview()
    {
        if (!$this->isAdmin()) return redirect()->route('login');

        $subscriptions = DB::table('subscriptions')->where('status', 'active')->whereNull('deleted_at');
        $metrics = [
            'Người dùng hoạt động' => DB::table('users')->where('role', 'user')->where('is_active', 1)->count(),
            'Gói đang theo dõi' => (clone $subscriptions)->count(),
            'Mẫu dịch vụ đang mở' => DB::table('service_templates')->where('is_active', 1)->count(),
            'Hóa đơn đã bóc tách' => DB::table('ai_ingestion_logs')->where('status', 'processed')->count(),
        ];
        $upcoming = $subscriptions->whereDate('next_billing_date', '>=', today())->orderBy('next_billing_date')->limit(6)->get();
        $rates = DB::table('exchange_rates')->orderByDesc('fetched_at')->limit(4)->get();
        $datasets = config('admin-data') + config('admin');
        $tableCounts = collect($datasets)->map(fn ($config) => DB::table($config['table'])
            ->when($config['exclude_deleted'] ?? false, fn ($query) => $query->whereNull('deleted_at'))->count());
        return view('admin.overview', compact('metrics', 'upcoming', 'rates', 'tableCounts'));
    }

    public function dataset(Request $request, string $section)
    {
        if (!$this->isAdmin()) return redirect()->route('login');

        $config = config('admin-data.'.$section);
        $query = $request->validate([
            'q' => 'nullable|string|max:160',
            'filter' => ['nullable', 'string', Rule::in(array_keys($config['filter'][1]))],
        ]);
        $search = $query['q'] ?? '';
        $filter = $query['filter'] ?? '';
        $builder = DB::table($config['table'].' as r');
        foreach ($config['joins'] ?? [] as [$table, $foreignKey, $localKey]) {
            $builder->leftJoin($table, $foreignKey, '=', $localKey);
        }
        if ($config['exclude_deleted'] ?? false) $builder->whereNull('r.deleted_at');
        if ($filter !== '') $builder->where($config['filter'][0], $filter);
        if ($search !== '') {
            $builder->where(function ($query) use ($config, $search) {
                foreach ($config['search'] as $column) {
                    $query->orWhere($column, 'like', '%'.$search.'%');
                }
            });
        }
        foreach ($config['columns'] as $alias => [, $column]) {
            $builder->addSelect($column.' as '.$alias);
        }
        $rows = $builder->orderByDesc('r.id')->paginate(20)->withQueryString();

        return view('admin.dataset', compact('section', 'config', 'search', 'filter', 'rows'));
    }

    public function catalog(Request $request, string $section)
    {
        if (!$this->isAdmin()) return redirect()->route('login');
        $config = $this->config($section);
        $query = $request->validate(['q' => 'nullable|string|max:160', 'edit' => 'nullable|string|max:20']);
        $search = $query['q'] ?? '';
        $edit = $query['edit'] ?? null;
        $table = DB::table($config['table']);
        $record = $edit !== null && $edit !== 'new' && ctype_digit($edit) ? (clone $table)->find((int) $edit) : null;
        if ($edit !== null && $edit !== 'new' && !$record) abort(404);
        $rows = $table->when($search !== '', fn ($builder) => $builder->where(array_key_first($config['columns']), 'like', '%'.$search.'%'))
            ->orderByDesc('id')->paginate(20)->appends(['q' => $search]);
        $categories = $section === 'templates' ? DB::table('categories')->orderBy('sort_order')->pluck('name', 'id') : collect();
        return view('admin.catalog', compact('section', 'config', 'search', 'edit', 'record', 'rows', 'categories'));
    }

    public function save(Request $request, string $section)
    {
        if (!$this->isAdmin()) return redirect()->route('login');
        $config = $this->config($section);
        $table = $config['table'];
        $id = $request->validate(['id' => ['nullable', 'integer', Rule::exists($table, 'id')]])['id'] ?? null;
        $rules = $config['rules'];
        if (isset($rules['slug'])) {
            $unique = Rule::unique($table, 'slug');
            $rules['slug'][] = $id ? $unique->ignore((int) $id) : $unique;
        }
        $values = $request->validate($rules);
        if ($section === 'templates' && !empty($values['plans_json'])) {
            $plans = json_decode($values['plans_json'], true);
            if (!is_array($plans) || !array_is_list($plans) || !str_starts_with(ltrim($values['plans_json']), '[')) {
                return back()->withInput()->withErrors(['plans_json' => 'Gói cước phải là mảng JSON.']);
            }
            foreach ($plans as $plan) {
                if (!is_array($plan) || validator($plan, [
                    'name' => 'required|string|max:120', 'amount' => 'required|numeric|min:0',
                    'currency' => 'required|regex:/^[A-Z]{3}$/',
                    'cycle' => 'required|in:weekly,monthly,quarterly,yearly,custom',
                    'custom_days' => 'required_if:cycle,custom|nullable|integer|min:1|max:999',
                ])->fails()) {
                    return back()->withInput()->withErrors(['plans_json' => 'Kiểm tra tên, giá, tiền tệ và chu kỳ của từng gói.']);
                }
            }
        }
        if (isset($values['fetched_at'])) $values['fetched_at'] = str_replace('T', ' ', $values['fetched_at']).':00';
        $values['updated_at'] = now();
        try {
            if ($id) {
                DB::table($table)->where('id', $id)->update($values);
            } else {
                if ($section !== 'rates') $values['created_at'] = now();
                DB::table($table)->insert($values);
            }
        } catch (QueryException $exception) {
            report($exception);
            return back()->withInput()->withErrors(['record' => 'Không thể lưu bản ghi. Kiểm tra dữ liệu và thử lại.']);
        }
        return redirect()->route('catalog', $section)->with('status', 'Đã lưu thay đổi.');
    }

    public function delete(string $section, int $id)
    {
        if (!$this->isAdmin()) return redirect()->route('login');
        try {
            DB::table($this->config($section)['table'])->where('id', $id)->delete();
        } catch (QueryException $exception) {
            report($exception);
            return back()->withErrors(['record' => 'Không thể xóa bản ghi. Bản ghi có thể đang được sử dụng.']);
        }
        return redirect()->route('catalog', $section)->with('status', 'Đã xóa bản ghi.');
    }

    private function isAdmin(): bool
    {
        $user = Auth::user();
        return $user && $user->role === 'admin' && (bool) $user->is_active;
    }

    private function config(string $section): array
    {
        return config('admin.'.$section);
    }
}
