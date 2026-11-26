'use strict';

const root = document.querySelector('#app');
const data = structuredClone(window.BillTrackDemoData);
data.notices = [];
data.audit_events = [];
data.support_cases = [{ id: 1, user_id: 3, title: 'Kiểm tra khoản chia YouTube Gia đình', topic: 'billing', priority: 'normal', body: 'Người dùng muốn kiểm tra khoản đóng của kỳ hiện tại.', created_at: '2026-11-24T02:30:00Z' }];
data.ai_reviews = [];
data.price_alerts = [];
data.saving_tips = [{ id: 1, title: 'Kiểm tra dịch vụ nghe nhạc trùng nhau', body: 'YouTube Premium có YouTube Music Premium. Hãy so sánh mức sử dụng trước khi gia hạn một gói nghe nhạc khác.', place: 'dashboard', published: true }];
data.notification_templates = [{ renewal: 'Gói {service_name} sẽ gia hạn sau {days_left} ngày với phí {amount}.', trial: 'Gói dùng thử {service_name} còn {days_left} ngày. Phí tiếp theo là {amount}.' }];
const editKey = 'billtrack-admin-demo-catalog';
const sessionKey = 'billtrack-admin-demo-session';
const demoEmail = 'admin-demo@billtrack.local';
const demoPassword = 'BillTrackDemo123!';
const formatNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 });
const formatDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' });
const escapeHtml = (value) => String(value ?? '—').replace(/[&<>"']/g, (character) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]
));
const amount = (value) => formatNumber.format(value);
const vnd = (value) => amount(value) + ' ₫';
const date = (value) => value ? formatDate.format(new Date(value + (value.includes('T') ? '' : 'T00:00:00'))) : '—';
const due = (days) => {
  const result = new Date();
  result.setDate(result.getDate() + days);
  return formatDate.format(result);
};
const find = (table, id, key) => data[table].find((row) => row.id === id)?.[key] ?? '—';
const statuses = {
  active: 'Đang hoạt động', paused: 'Tạm dừng', cancelled: 'Đã hủy', expired: 'Hết hạn',
  paid: 'Đã đóng', unpaid: 'Chưa đóng', processed: 'Đã xử lý', pending: 'Chờ xử lý', failed: 'Lỗi',
};
const role = { user: 'Người dùng', admin: 'Quản trị' };
const methodType = { card: 'Thẻ', bank: 'Ngân hàng', ewallet: 'Ví điện tử' };
const splitMode = { equal: 'Chia đều', custom: 'Tùy chỉnh' };
const historySource = { manual: 'Thủ công', ai_text: 'AI văn bản', ai_ocr: 'AI OCR' };
const yes = (value, text) => value ? text : '—';
const keyOf = (field) => (row) => row[field];
const field = (label, name) => [label, keyOf(name)];
const col = (label, get) => [label, get];
const statusColumn = (key) => col('Trạng thái', (row) => statuses[row[key]]);
const statusFilter = (key, keys) => [key, Object.fromEntries(keys.map((item) => [item, statuses[item]]))];

const sections = {
  users: { title: 'Người dùng', table: 'users', columns: [
    field('Họ tên', 'full_name'), field('Email', 'email'), col('Quyền', (r) => role[r.role]),
    col('Trạng thái', (r) => r.is_active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'), col('Telegram', (r) => r.telegram_linked ? 'Đã liên kết' : 'Chưa liên kết'),
    col('Lịch .ics', (r) => r.ical_enabled ? 'Đã bật' : 'Chưa bật'), col('Ngày tạo', (r) => date(r.created_at)),
  ], filter: ['role', role] },
  subscriptions: { title: 'Gói đăng ký', table: 'subscriptions', columns: [
    field('Dịch vụ', 'service_name'), field('Gói cước', 'plan_name'),
    col('Người dùng', (r) => find('users', r.user_id, 'full_name')),
    col('Danh mục', (r) => find('categories', r.category_id, 'name')),
    col('Nguồn tiền', (r) => find('payment_methods', r.payment_method_id, 'provider_name')),
    col('Giá gốc', (r) => amount(r.amount) + ' ' + r.currency), col('Quy đổi VND', (r) => vnd(r.amount_vnd)),
    col('Gia hạn', (r) => r.status === 'active' ? due(r.due_in_days) : '—'), col('Dùng thử', (r) => yes(r.is_free_trial, 'Dùng thử')),
    col('Tăng giá', (r) => yes(r.price_hike_flagged, 'Tăng giá')), statusColumn('status'),
  ], filter: statusFilter('status', ['active', 'paused', 'cancelled', 'expired']) },
  'payment-methods': { title: 'Nguồn thanh toán', table: 'payment_methods', columns: [
    field('Nhà cung cấp', 'provider_name'), col('Người dùng', (r) => find('users', r.user_id, 'full_name')),
    col('Loại', (r) => methodType[r.method_type]), col('Số cuối', (r) => '•••• ' + r.last_four_digits),
    col('Trạng thái', (r) => r.is_locked ? 'Đang khóa' : 'Đang mở'),
  ], filter: ['method_type', methodType] },
  'billing-history': { title: 'Lịch sử hóa đơn', table: 'subscription_histories', columns: [
    col('Dịch vụ', (r) => find('subscriptions', r.subscription_id, 'service_name')), col('Ngày hóa đơn', (r) => date(r.billed_date)),
    col('Giá trước', (r) => r.previous_amount == null ? '—' : amount(r.previous_amount)),
    col('Giá kỳ này', (r) => amount(r.amount)), field('Tiền tệ', 'currency'),
    col('Tăng giá', (r) => yes(r.is_price_hike, 'Tăng giá')), col('Nguồn', (r) => historySource[r.source_type]),
  ], filter: ['source_type', historySource] },
  groups: { title: 'Nhóm chia sẻ', table: 'subscription_groups', columns: [
    field('Nhóm', 'group_name'), col('Chủ nhóm', (r) => find('users', r.host_user_id, 'full_name')),
    col('Dịch vụ', (r) => find('subscriptions', r.subscription_id, 'service_name')),
    col('Cách chia', (r) => splitMode[r.split_mode]), col('Ngày tạo', (r) => date(r.created_at)),
  ], filter: ['split_mode', splitMode] },
  'group-splits': { title: 'Khoản chia nhóm', table: 'group_splits', columns: [
    field('Thành viên', 'member_name'), col('Nhóm', (r) => find('subscription_groups', r.group_id, 'group_name')),
    field('Kỳ thanh toán', 'billing_period'), col('Số tiền', (r) => vnd(r.amount_due)),
    statusColumn('payment_status'), col('Ngày đóng', (r) => date(r.paid_at)),
  ], filter: statusFilter('payment_status', ['paid', 'unpaid']) },
  templates: { title: 'Mẫu dịch vụ', table: 'service_templates', columns: [
    field('Dịch vụ', 'name'), field('Đường dẫn', 'slug'), col('Danh mục', (r) => find('categories', r.category_id, 'name')),
    col('Gói cước', (r) => (r.plans_json ?? []).map((plan) => plan.name).join(', ') || '—'),
    field('Màu thương hiệu', 'brand_color'),
    col('Trạng thái', (r) => r.is_active ? 'Đang mở' : 'Đã ẩn'),
  ], filter: ['is_active', { 1: 'Đang mở', 0: 'Đã ẩn' }], fields: {
    name: ['Tên dịch vụ', 'text'], slug: ['Đường dẫn', 'slug'], category_id: ['Danh mục', 'category'],
    logo_url: ['URL logo', 'url'], brand_color: ['Màu thương hiệu', 'color', '#8B2E2E'],
    official_cancel_url: ['URL hủy chính thức', 'url'], cancel_instructions: ['Các bước hủy', 'note'], perks: ['Quyền lợi và lưu ý', 'note'],
    is_active: ['Trạng thái', 'active', 1], plans_json: ['Gói cước', 'plans'],
  } },
  categories: { title: 'Danh mục', table: 'categories', columns: [
    field('Danh mục', 'name'), field('Đường dẫn', 'slug'), field('Màu', 'color_hex'), field('Icon', 'icon'), field('Thứ tự', 'sort_order'),
  ], fields: { name: ['Tên danh mục', 'text'], slug: ['Đường dẫn', 'slug'], icon: ['Biểu tượng', 'text', 'layers'], color_hex: ['Mã màu', 'color', '#8B2E2E'], sort_order: ['Thứ tự', 'number', 0] } },
  rates: { title: 'Tỷ giá', table: 'exchange_rates', columns: [
    field('Ngoại tệ', 'currency_code'), col('Tỷ giá sang VND', (r) => vnd(r.rate_to_vnd)),
    field('Nguồn', 'source_bank'), col('Cập nhật', (r) => date(r.fetched_at)),
  ], fields: { currency_code: ['Mã ngoại tệ', 'currency'], rate_to_vnd: ['Tỷ giá sang VND', 'decimal'], source_bank: ['Nguồn', 'text', 'Dữ liệu mẫu'], fetched_at: ['Cập nhật', 'datetime-local', '2026-11-24T09:00'] } },
  'ingestion-logs': { title: 'Nhật ký bóc tách', table: 'ai_ingestion_logs', columns: [
    col('Người dùng', (r) => find('users', r.user_id, 'full_name')),
    col('Dịch vụ', (r) => find('subscriptions', r.subscription_id, 'service_name')),
    col('Đầu vào', (r) => r.input_type === 'email_text' ? 'Văn bản email' : 'Ảnh hóa đơn'),
    statusColumn('status'), col('Thời điểm', (r) => date(r.created_at)),
  ], filter: statusFilter('status', ['pending', 'processed', 'failed']) },
};
sections.notifications = { title: 'Nhắc hết hạn', table: 'notices' };
Object.assign(sections, {
  promote: { title: 'Dịch vụ người dùng tự nhập' },
  backup: { title: 'Sao lưu cấu hình' },
  operations: { title: 'Việc cần xử lý' },
  support: { title: 'Hỗ trợ tài khoản', table: 'support_cases' },
  audit: { title: 'Nhật ký thao tác', table: 'audit_events' },
  'price-alerts': { title: 'Cảnh báo tăng giá', table: 'price_alerts' },
  'saving-tips': { title: 'Mẹo tiết kiệm', table: 'saving_tips' },
  'message-templates': { title: 'Mẫu thông báo', table: 'notification_templates' },
});
const navigation = {
  'Quản lý đăng ký': ['users', 'subscriptions', 'notifications'],
  'Chia hóa đơn': ['groups', 'group-splits'],
  'Kho dữ liệu': ['templates', 'promote', 'categories', 'rates', 'backup'],
  'Vận hành': ['operations', 'support', 'ingestion-logs', 'audit', 'price-alerts', 'saving-tips', 'message-templates'],
};
const savedTables = [...Object.values(sections).filter((section) => section.fields).map((section) => section.table), 'subscriptions', 'notices', 'subscription_groups', 'group_splits', 'users', 'price_alerts', 'saving_tips', 'notification_templates', 'audit_events', 'support_cases', 'ai_reviews'];
let signedIn = false;
try {
  signedIn = sessionStorage.getItem(sessionKey) === '1';
  const saved = JSON.parse(localStorage.getItem(editKey) || '{}');
  for (const table of savedTables) {
    if (Array.isArray(saved[table])) data[table] = saved[table];
  }
} catch {
  // The demo is still usable when browser storage is blocked.
}
let message = '';
const brand = '<span class="logo" aria-hidden="true">B</span> BillTrack';

function showLogin() {
  root.innerHTML = '<main class="login"><section class="login-form"><div class="brand">' + brand +
    '</div><h1>Đăng nhập quản trị</h1><p class="muted">Tài khoản mẫu để xem giao diện BillTrack.</p>' +
    '<form class="fields" id="login-form"><label>Email <input type="email" name="email" autocomplete="username" required></label>' +
    '<label>Mật khẩu <input type="password" name="password" autocomplete="current-password" required></label>' +
    '<p class="errors" role="alert" id="login-error" hidden>Email hoặc mật khẩu chưa đúng.</p>' +
    '<button class="primary">Đăng nhập</button><button type="button" data-fill>Tự điền tài khoản mẫu</button></form></section>' +
    '<aside class="login-art"><div><strong>Quản lý gói định kỳ</strong><p>Dùng dữ liệu mẫu để xem các trang quản trị mà không cần kết nối cơ sở dữ liệu.</p></div></aside></main>';
  const form = root.querySelector('#login-form');
  form.querySelector('[data-fill]').addEventListener('click', () => {
    form.elements.email.value = demoEmail;
    form.elements.password.value = demoPassword;
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (form.elements.email.value.toLowerCase().trim() !== demoEmail || form.elements.password.value !== demoPassword) {
      form.querySelector('#login-error').hidden = false;
      return;
    }
    signedIn = true;
    try { sessionStorage.setItem(sessionKey, '1'); } catch { /* fallback to memory */ }
    render();
  });
}

function nav(current) {
  const link = (key, title) => '<a href="#' + key + '"' + (current === key ? ' aria-current="page"' : '') + '>' + title + '</a>';
  return link('overview', 'Tổng quan') + Object.entries(navigation).map(([group, keys]) =>
    '<div class="nav-group"><p>' + group + '</p>' + keys.map((key) => link(key, sections[key].title)).join('') + '</div>'
  ).join('');
}

function overview() {
  const active = data.subscriptions.filter((row) => row.status === 'active');
  const metrics = [
    ['Tổng người dùng', data.users.filter((row) => row.role === 'user').length],
    ['Gói đang theo dõi', active.length],
    ['Gói đến hạn trong 7 ngày', active.filter((row) => row.due_in_days <= 7).length],
    ['Khoản chia chưa đóng', data.group_splits.filter((row) => row.payment_status === 'unpaid').length],
  ];
  const cards = metrics.map(([label, count]) => '<section class="panel metric"><span>' + label + '</span><strong>' + count + '</strong></section>').join('');
  const directory = Object.entries(navigation).map(([group, keys]) => '<section class="panel directory-group"><h3>' + group + '</h3>' +
    keys.map((key) => '<a class="directory-link" href="#' + key + '"><span>' + sections[key].title + '</span><strong>' +
      (key === 'notifications' ? active.filter((row) => row.due_in_days <= 7 && !renewalNotice(row)).length : (data[sections[key].table]?.length ?? 'Mở')) + '</strong></a>').join('') + '</section>').join('');
  const summary = (title, detail, value) => '<div class="summary"><div><strong>' + escapeHtml(title) + '</strong><small>' +
    escapeHtml(detail) + '</small></div><strong class="amount">' + escapeHtml(value) + '</strong></div>';
  return '<section class="hero"><p>' + formatDate.format(new Date()) + '</p><h2>Lịch gia hạn</h2><p>' + active.length +
    ' gói mẫu đang được theo dõi.</p><a class="hero-link" href="#notifications">Xem gói sắp đến hạn</a></section><div class="metrics">' + cards +
    '</div><section class="directory"><h2>Dữ liệu hệ thống</h2><div class="directory-grid">' + directory +
    '</div></section>' + topServices(active) + '<div class="overview-grid"><section class="panel"><header><h2>Gia hạn sắp tới</h2></header>' +
    active.sort((a, b) => a.due_in_days - b.due_in_days).map((row) => summary(row.service_name,
      due(row.due_in_days) + (row.is_free_trial ? ' · Hết dùng thử' : ''), vnd(row.amount_vnd))).join('') +
    '</section><section class="panel"><header><h2>Khoản chia chưa đóng</h2><a href="#group-splits">Xem khoản chia</a></header>' +
    (data.group_splits.filter((row) => row.payment_status === 'unpaid').slice(0, 5).map((row) => summary(row.member_name, find('subscription_groups', row.group_id, 'group_name'), vnd(row.amount_due))).join('') || '<p class="empty">Mọi khoản chia đã được thanh toán.</p>') + '</section></div>';
}

function options(items, value) {
  return Object.entries(items).map(([key, label]) => '<option value="' + escapeHtml(key) + '"' +
    (String(value) === key ? ' selected' : '') + '>' + escapeHtml(label) + '</option>').join('');
}

function mountPlanFields(form) {
  const source = form.elements.plans_json;
  if (!source) return;
  const holder = document.createElement('div');
  holder.className = 'plan-editor';
  const rows = document.createElement('div');
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = '+ Thêm gói cước';
  holder.append(rows, add);
  source.parentElement.replaceWith(holder);
  holder.classList.add('wide');
  holder.append(source);
  source.hidden = true;
  const cycleLabels = { weekly: 'Hằng tuần', monthly: 'Hằng tháng', quarterly: 'Hằng quý', yearly: 'Hằng năm', custom: 'Tùy chỉnh' };
  const sync = () => {
    source.value = JSON.stringify([...rows.children].map((row) => {
      const fields = Object.fromEntries([...row.querySelectorAll('[data-plan]')].map((field) => [field.dataset.plan, field.value]));
      return { name: fields.name.trim(), amount: Number(fields.amount), currency: fields.currency,
        cycle: fields.cycle, ...(fields.cycle === 'custom' ? { custom_days: Number(fields.custom_days) } : {}) };
    }));
  };
  function append(plan = {}) {
    const row = document.createElement('div');
    row.className = 'plan-row';
    row.innerHTML = '<label>Tên gói<input data-plan="name" maxlength="120" required></label>' +
      '<label>Mức giá<input data-plan="amount" type="number" min="0" step="any" required></label>' +
      '<label>Tiền tệ<input data-plan="currency" maxlength="3" pattern="[A-Z]{3}" required></label>' +
      '<label>Chu kỳ<select data-plan="cycle">' + options(cycleLabels, plan.cycle ?? 'monthly') + '</select></label>' +
      '<label>Số ngày<input data-plan="custom_days" type="number" min="1" max="999" step="1"></label>' +
      '<button type="button" class="danger">Bỏ gói</button>';
    row.querySelector('[data-plan=name]').value = plan.name ?? '';
    row.querySelector('[data-plan=amount]').value = plan.amount ?? '';
    row.querySelector('[data-plan=currency]').value = plan.currency ?? 'VND';
    const cycle = row.querySelector('[data-plan=cycle]');
    const custom = row.querySelector('[data-plan=custom_days]');
    custom.value = plan.custom_days ?? '';
    const toggleDays = () => {
      custom.disabled = cycle.value !== 'custom';
      custom.required = !custom.disabled;
    };
    toggleDays();
    cycle.addEventListener('change', toggleDays);
    row.addEventListener('input', sync);
    row.addEventListener('change', sync);
    row.querySelector('button').addEventListener('click', () => { row.remove(); sync(); });
    rows.append(row);
    return row;
  }
  const saved = JSON.parse(source.value || '[]');
  saved.forEach(append);
  add.addEventListener('click', () => {
    const row = append();
    sync();
    row.querySelector('input').focus();
  });
  form.addEventListener('submit', sync);
}

function editor(section, row) {
  const controls = Object.entries(section.fields).map(([key, [label, type, fallback]]) => {
    const value = row?.[key] ?? fallback ?? '';
    const head = '<label>' + label;
    const name = ' name="' + key + '"';
    if (type === 'note') return '<label class="wide">' + label + '<textarea name="' + key + '" rows="3" maxlength="1500">' + escapeHtml(value) + '</textarea></label>';
    if (type === 'plans') {
      return '<label class="wide">' + label + ' (JSON)<textarea' + name + ' rows="4">' +
        escapeHtml(JSON.stringify(value || [], null, 2)) + '</textarea></label>';
    }
    if (type === 'category' || type === 'active') {
      const items = type === 'category' ? Object.fromEntries(data.categories.map((item) => [item.id, item.name])) : { 1: 'Đang mở', 0: 'Đã ẩn' };
      return head + '<select' + name + ' required><option value="">Chọn</option>' + options(items, value) + '</select></label>';
    }
    const config = {
      slug: ['text', ' pattern="[a-z0-9]+(?:-[a-z0-9]+)*"'],
      currency: ['text', ' maxlength="3" pattern="[A-Z]{3}"'],
      number: ['number', ' min="0" step="1"'],
      decimal: ['number', ' min="0.0001" step="0.0001"'],
    };
    const [inputType, attributes] = config[type] ?? [type, ''];
    return head + '<input type="' + inputType + '"' + name + attributes + ' value="' + escapeHtml(value) + '"' + (type === 'url' ? '' : ' required') + '></label>';
  }).join('');
  return '<section class="panel edit-panel"><header><h2>' + (row?.id ? 'Chỉnh sửa' : 'Thêm mới') +
    '</h2><button type="button" data-close>Đóng</button></header><form id="edit-form" class="fields editor" data-id="' + (row?.id ?? '') +
    '">' + controls + '<p class="errors wide" role="alert" hidden></p><div class="wide"><button class="primary">Lưu thay đổi</button></div></form></section>';
}

function saveLocal() {
  try {
    const catalog = Object.fromEntries(savedTables.map((table) => [table, data[table]]));
    localStorage.setItem(editKey, JSON.stringify(catalog));
    message = 'Đã lưu thay đổi mẫu trên trình duyệt.';
  } catch {
    message = 'Đã áp dụng thay đổi cho phiên hiện tại.';
  }
}

function list(section, params) {
  const isGroups = section.table === 'subscription_groups';
  const userId = section.table === 'subscriptions' ? params.get('user') : null;
  const groupId = section.table === 'group_splits' ? params.get('group') : null;
  const context = userId ? ['Người dùng', find('users', Number(userId), 'full_name'), '#subscriptions'] :
    groupId ? ['Nhóm', find('subscription_groups', Number(groupId), 'group_name'), '#group-splits'] : null;
  const ratesAction = section.table === 'exchange_rates' ? '<div class="page-actions"><button data-sync-rates type="button">Nạp lại tỷ giá mẫu</button><p class="muted">Mô phỏng đồng bộ từ ngân hàng. Dùng nút Sửa để nhập tỷ giá thủ công.</p></div>' : '';
  const contextLabel = context ? '<p class="dataset-description">' + context[0] + ' <strong>' + escapeHtml(context[1]) + '</strong> · <a href="' + context[2] + '">Xem tất cả</a></p>' : '';
  return contextLabel + ratesAction + (isGroups ? '<div class="page-actions"><a class="primary" href="#groups/new">Tạo nhóm chia hóa đơn</a></div>' : '') + (section.fields ? '<div class="page-actions"><button class="primary" data-edit="">+ Thêm mới</button></div><div data-editor></div>' : '') +
    '<section class="panel"><header><h2>Danh sách</h2><span class="record-count" data-count></span></header>' +
    '<form class="search dataset-search"><input type="search" name="query" aria-label="Tìm bản ghi" placeholder="Tìm bản ghi">' +
    (section.filter ? '<select name="filter" aria-label="Bộ lọc"><option value="">Tất cả</option>' + options(section.filter[1], '') + '</select>' : '') +
    '<button>Lọc dữ liệu</button></form><div class="table-wrap" tabindex="0"><table><thead><tr>' +
    section.columns.map(([title]) => '<th scope="col">' + title + '</th>').join('') +
    (section.fields || section.table === 'group_splits' ? '<th scope="col">Thao tác</th>' : '') + '</tr></thead><tbody></tbody></table></div></section>';
}

function bindSection(section, params) {
  const search = root.querySelector('.search');
  const body = root.querySelector('tbody');
  const linkFor = (row) => ({
    users: '#users/' + row.id,
    ai_ingestion_logs: '#ingestion-logs/' + row.id,
    subscriptions: '#subscriptions/' + row.id,
    subscription_groups: '#group-splits?group=' + row.id,
  })[section.table];
  const matchesContext = (row) => (section.table !== 'subscriptions' || !params.has('user') || String(row.user_id) === params.get('user')) &&
    (section.table !== 'group_splits' || !params.has('group') || String(row.group_id) === params.get('group'));
  const draw = () => {
    const query = search.elements.query.value.trim().toLocaleLowerCase('vi');
    const filter = search.elements.filter?.value;
    const rows = data[section.table].filter((row) => matchesContext(row) && (!filter || String(row[section.filter[0]]) === filter) &&
      section.columns.some(([, get]) => String(get(row) ?? '').toLocaleLowerCase('vi').includes(query)));
    if (section.table === 'categories') rows.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'vi'));
    root.querySelector('[data-count]').textContent = rows.length + ' bản ghi';
    body.innerHTML = rows.map((row) => '<tr>' + section.columns.map(([, get], index) => '<td>' + (index === 0 && linkFor(row)
      ? '<a class="record-link" href="' + linkFor(row) + '">' + escapeHtml(get(row)) + '</a>'
      : escapeHtml(get(row))) + '</td>').join('') +
      (section.fields ? '<td><div class="actions"><button data-edit="' + row.id + '">Sửa</button><button class="danger" data-delete="' + row.id + '">Xóa</button></div></td>' : '') +
      (section.table === 'group_splits' ? '<td>' + (row.payment_status === 'unpaid'
        ? '<button data-paid="' + row.id + '">Xác nhận đã đóng</button>' : '<span class="badge active">Đã xác nhận</span>') + '</td>' : '') + '</tr>').join('') ||
      '<tr><td class="empty" colspan="' + (section.columns.length + (section.fields || section.table === 'group_splits' ? 1 : 0)) + '">Không có bản ghi phù hợp.</td></tr>';
  };
  search.addEventListener('submit', (event) => { event.preventDefault(); draw(); });
  search.addEventListener('input', draw);
  draw();
  if (section.table === 'group_splits') {
    body.addEventListener('click', (event) => {
      const button = event.target.closest('[data-paid]');
      const row = button && data.group_splits.find((item) => item.id === Number(button.dataset.paid));
      if (!row || row.payment_status !== 'unpaid') return;
      row.payment_status = 'paid';
      row.paid_at = new Date().toISOString();
      audit('billing', 'Xác nhận đã đóng', 'Khoản chia #' + row.id);
      saveLocal();
      message = 'Đã xác nhận khoản đóng của ' + row.member_name + '.';
      render();
    });
  }
  if (!section.fields) return;
  const editorArea = root.querySelector('[data-editor]');
  const onEdit = (id, draft) => {
    const row = data[section.table].find((item) => String(item.id) === id);
    editorArea.innerHTML = editor(section, row ?? draft);
    editorArea.querySelector('[data-close]').onclick = () => { editorArea.innerHTML = ''; };
    const form = editorArea.querySelector('form');
    mountPlanFields(form);
    form.querySelector('input:not([type=hidden]), select, textarea')?.focus();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      try {
        for (const [key, [, type]] of Object.entries(section.fields)) {
          values[key] = values[key].trim();
          if (type === 'url' && values[key] && !validWebUrl(values[key])) throw new Error('Đường dẫn phải dùng HTTP hoặc HTTPS.');
          if (['number', 'decimal', 'category', 'active'].includes(type)) values[key] = Number(values[key]);
          if (type === 'plans') {
            values[key] = JSON.parse(values[key] || '[]');
            if (!Array.isArray(values[key]) || values[key].some((plan) => !validPlan(plan))) {
              throw new Error('Kiểm tra tên, giá, tiền tệ và chu kỳ của từng gói.');
            }
          }
        }
        if (section.table === 'service_templates' && (!textValue(values.name, 150) || !slugValue(values.slug) || !isColor(values.brand_color))) {
          throw new Error('Kiểm tra tên dịch vụ, đường dẫn và màu thương hiệu.');
        }
        if (section.table === 'categories' && (!textValue(values.name, 100) || !slugValue(values.slug) || !textValue(values.icon, 100) || !isColor(values.color_hex) || !Number.isSafeInteger(values.sort_order))) {
          throw new Error('Kiểm tra tên, đường dẫn, icon, màu và thứ tự danh mục.');
        }
        if (section.table === 'exchange_rates' && (!currencyValue(values.currency_code) || !Number.isFinite(values.rate_to_vnd) || values.rate_to_vnd <= 0 || !textValue(values.source_bank, 100) || !Number.isFinite(Date.parse(values.fetched_at)))) {
          throw new Error('Kiểm tra mã ngoại tệ, tỷ giá, nguồn và thời điểm cập nhật.');
        }
        if (values.slug && data[section.table].some((item) => item.id !== row?.id && item.slug === values.slug)) {
          throw new Error('Đường dẫn này đã được sử dụng.');
        }
      } catch (error) {
        const alert = form.querySelector('.errors');
        alert.textContent = error instanceof SyntaxError ? 'Gói cước phải là dữ liệu JSON hợp lệ.' : error.message;
        alert.hidden = false;
        return;
      }
      const id = row?.id ?? Math.max(0, ...data[section.table].map((item) => item.id)) + 1;
      const next = { ...row, ...values, id };
      data[section.table] = row ? data[section.table].map((item) => item.id === row.id ? next : item) : [next, ...data[section.table]];
      audit('catalog', row ? 'Cập nhật ' + section.title : 'Thêm ' + section.title, '#' + id);
      saveLocal();
      render();
    });
  };
  const candidate = section.table === 'service_templates' && promotedServices().find((item) => item.key === params.get('promote'));
  if (candidate) onEdit('', { name: candidate.name, slug: serviceKey(candidate.name).normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), category_id: candidate.category });
  root.querySelector('.page-actions').addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit]');
    if (button) onEdit(button.dataset.edit);
  });
  body.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit]');
    const remove = event.target.closest('[data-delete]');
    if (edit) onEdit(edit.dataset.edit);
    if (remove) {
      const id = Number(remove.dataset.delete);
      const used = (section.table === 'categories' && [...data.service_templates, ...data.subscriptions].some((row) => row.category_id === id)) ||
        (section.table === 'service_templates' && data.subscriptions.some((row) => row.template_id === id));
      if (used) {
        window.alert('Bản ghi đang được sử dụng trong dữ liệu mẫu.');
      } else if (window.confirm('Xóa bản ghi mẫu này?')) {
        data[section.table] = data[section.table].filter((row) => row.id !== id);
        audit('catalog', 'Xóa ' + section.title, '#' + id);
        saveLocal();
        render();
      }
    }
  });
}

function renewalNotice(row) {
  return data.notices.find((notice) => notice.subscription_id === row.id);
}

function notify(row) {
  if (!row || row.status !== 'active' || row.due_in_days > 7 || renewalNotice(row)) return;
  const template = data.notification_templates[0][row.is_free_trial ? 'trial' : 'renewal'];
  const text = renderMessage(template, { service_name: row.service_name, amount: vnd(row.amount_vnd), days_left: row.due_in_days });
  data.notices.unshift({ subscription_id: row.id, sent_at: new Date().toISOString(), text });
  audit('notification', 'Gửi nhắc hạn mẫu', 'Gói #' + row.id);
  saveLocal();
  message = 'Đã ghi nhận nhắc hạn mô phỏng cho ' + find('users', row.user_id, 'full_name') + '.';
  render();
}

function notifications() {
  const upcoming = data.subscriptions.filter((row) => row.status === 'active' && row.due_in_days <= 7)
    .sort((a, b) => a.due_in_days - b.due_in_days);
  const reminderRows = upcoming.map((row) => '<tr><td><a href="#subscriptions/' + row.id + '">' +
    escapeHtml(row.service_name) + '</a></td><td>' + escapeHtml(find('users', row.user_id, 'full_name')) +
    '</td><td>' + escapeHtml(due(row.due_in_days)) + '</td><td>' + (row.is_free_trial ? 'Hết dùng thử' : 'Đến kỳ gia hạn') +
    '</td><td>' + (renewalNotice(row) ? '<span class="badge active">Đã nhắc</span>' :
      '<button data-notify="' + row.id + '">Gửi nhắc</button>') + '</td></tr>').join('');
  const history = data.notices.map((notice) => {
    const row = data.subscriptions.find((item) => item.id === notice.subscription_id);
    return row ? '<div class="summary"><div><strong>' + escapeHtml(row.service_name) + '</strong><small>' +
      escapeHtml(notice.text ?? find('users', row.user_id, 'full_name')) + '</small></div><span>' +
      escapeHtml(formatDate.format(new Date(notice.sent_at))) + '</span></div>' : '';
  }).join('');
  return '<p class="muted dataset-description">Nhắc các gói đến hạn trong 7 ngày tới. Bản demo ghi nhận thông báo trong trình duyệt.</p>' +
    '<section class="panel operation-panel"><header><h2>Đến hạn trong 7 ngày</h2><span>' + upcoming.length + ' gói</span></header>' +
    '<div class="table-wrap" tabindex="0"><table><thead><tr><th>Gói</th><th>Người dùng</th><th>Đến hạn</th><th>Loại nhắc</th><th>Thao tác</th></tr></thead><tbody>' +
    (reminderRows || '<tr><td colspan="5" class="empty">Không có gói sắp hết hạn.</td></tr>') + '</tbody></table></div></section>' +
    '<section class="panel"><header><h2>Lịch sử gửi nhắc</h2></header>' +
    (history || '<p class="empty">Chưa ghi nhận thông báo nào.</p>') + '</section>';
}

function subscriptionDetail(row) {
  if (!row) return '<p class="empty">Không tìm thấy gói đăng ký.</p><a href="#subscriptions">Về danh sách gói</a>';
  const details = [
    ['Người dùng', find('users', row.user_id, 'full_name')],
    ['Gói cước', row.plan_name],
    ['Giá', amount(row.amount) + ' ' + row.currency],
    ['Quy đổi', vnd(row.amount_vnd)],
    ['Nguồn thanh toán', find('payment_methods', row.payment_method_id, 'provider_name')],
    ['Trạng thái', statuses[row.status]],
    ...(row.status === 'active' ? [[row.is_free_trial ? 'Hết dùng thử' : 'Kỳ gia hạn', due(row.due_in_days)]] : []),
  ];
  const canCancel = ['active', 'paused'].includes(row.status);
  const canNotify = row.status === 'active' && row.due_in_days <= 7 && !renewalNotice(row);
  return '<div class="page-actions actions"><a href="#subscriptions?user=' + row.user_id + '">Gói của người dùng</a>' +
    '<a href="#subscriptions">Tất cả gói</a></div><section class="panel operation-panel"><header><h2>Chi tiết gói</h2></header>' +
    details.map(([label, value]) => '<div class="summary"><span>' + label + '</span><strong>' + escapeHtml(value) + '</strong></div>').join('') +
    '</section><div class="actions">' +
    (canCancel ? '<button class="danger" data-cancel="' + row.id + '">Hủy gói trong BillTrack</button>' : '') +
    (canNotify ? '<button data-notify="' + row.id + '">Gửi nhắc hết hạn</button>' : '') +
    (row.status === 'active' ? '<a class="secondary" href="#groups/new?subscription=' + row.id + '">Chia hóa đơn</a>' : '') +
    '</div>' + (canCancel ? '<p class="muted operation-note">Hủy gói trong BillTrack chỉ cập nhật dữ liệu demo. Nhà cung cấp bên ngoài vẫn quản lý gia hạn và thu tiền.</p>' : '');
}

function splitEditor(selectedId) {
  const choices = Object.fromEntries(data.subscriptions.filter((row) => row.status === 'active')
    .map((row) => [row.id, row.service_name + ' · ' + find('users', row.user_id, 'full_name') + ' · ' + vnd(row.amount_vnd)]));
  return '<div class="page-actions"><a href="#groups">Về danh sách nhóm</a></div><section class="panel"><header><h2>Thiết lập chia đều</h2></header>' +
    '<form class="fields editor" id="split-form"><label>Gói đăng ký<select name="subscription" required><option value="">Chọn gói</option>' +
    options(choices, selectedId) + '</select></label><label>Tên nhóm<input name="group" maxlength="100" required></label>' +
    '<label class="wide">Tên thành viên, mỗi người một dòng<textarea name="members" rows="4" maxlength="1000" required></textarea></label>' +
    '<p class="errors wide" role="alert" hidden></p><div class="wide"><button class="primary">Lưu và chia hóa đơn</button></div></form></section>';
}

function createSplit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const subscription = data.subscriptions.find((row) => row.id === Number(form.elements.subscription.value) && row.status === 'active');
  const name = form.elements.group.value.trim();
  const members = form.elements.members.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  if (!subscription || !name || members.length < 2 || members.length > 20 || members.some((value) => value.length > 100)) {
    const alert = form.querySelector('.errors');
    alert.textContent = 'Chọn gói, nhập tên nhóm và từ 2 đến 20 tên thành viên hợp lệ.';
    alert.hidden = false;
    return;
  }
  const groupId = Math.max(0, ...data.subscription_groups.map((row) => row.id)) + 1;
  const firstId = Math.max(0, ...data.group_splits.map((row) => row.id)) + 1;
  const total = Math.round(subscription.amount_vnd);
  const each = Math.floor(total / members.length);
  const now = new Date();
  const period = String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
  data.subscription_groups.unshift({ id: groupId, subscription_id: subscription.id, host_user_id: subscription.user_id, group_name: name, split_mode: 'equal', created_at: now.toISOString() });
  data.group_splits.unshift(...members.map((member, index) => ({
    id: firstId + index, group_id: groupId, member_name: member, billing_period: period,
    amount_due: each + (index < total % members.length ? 1 : 0), payment_status: 'unpaid', paid_at: null,
  })));
  audit('billing', 'Tạo nhóm chia hóa đơn', 'Nhóm #' + groupId);
  saveLocal();
  message = 'Đã chia ' + vnd(total) + ' cho ' + members.length + ' thành viên.';
  window.location.hash = 'group-splits?group=' + groupId;
}

function bindOperations() {
  root.querySelectorAll('[data-notify]').forEach((button) => {
    button.addEventListener('click', () => notify(data.subscriptions.find((row) => row.id === Number(button.dataset.notify))));
  });
  root.querySelector('[data-cancel]')?.addEventListener('click', (event) => {
    const row = data.subscriptions.find((item) => item.id === Number(event.currentTarget.dataset.cancel));
    if (!row || !['active', 'paused'].includes(row.status) || !window.confirm('Hủy gói ' + row.service_name + ' trong dữ liệu demo?')) return;
    row.status = 'cancelled';
    audit('subscription', 'Hủy gói trong BillTrack', '#' + row.id);
    saveLocal();
    message = 'Đã hủy ' + row.service_name + ' trong BillTrack.';
    render();
  });
  root.querySelector('#split-form')?.addEventListener('submit', createSplit);
}

const configTables = ['service_templates', 'categories', 'exchange_rates'];
const serviceKey = (value) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
const isColor = (value) => /^#[0-9a-f]{6}$/i.test(value ?? '');
const validWebUrl = (value) => {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};
const textValue = (value, limit) => typeof value === 'string' && Boolean(value.trim()) && value.length <= limit;
const optionalText = (value, limit) => value == null || value === '' || textValue(value, limit);
const flag = (value) => [0, 1, false, true].includes(value);
const slugValue = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 160;
const currencyValue = (value) => typeof value === 'string' && /^[A-Z]{3}$/.test(value);
const cycles = ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
const validPlan = (plan) => plan && textValue(plan.name, 120) && Number.isFinite(plan.amount) && plan.amount >= 0 &&
  currencyValue(plan.currency) && cycles.includes(plan.cycle) &&
  (plan.cycle !== 'custom' || Number.isInteger(plan.custom_days) && plan.custom_days >= 1 && plan.custom_days <= 999);
const nextRecordId = (rows) => rows.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;
const panel = (title, content) => '<section class="panel operation-panel"><header><h2>' + escapeHtml(title) + '</h2></header>' + content + '</section>';
const recordLine = (title, detail, end) => '<div class="summary"><div><strong>' + escapeHtml(title) +
  '</strong><small>' + escapeHtml(detail) + '</small></div>' + (end || '') + '</div>';
const emptyText = (text) => '<p class="empty">' + escapeHtml(text) + '</p>';
const formAlert = '<p class="errors wide" role="alert" hidden></p>';
const setFormError = (form, value) => {
  const alert = form.querySelector('[role=alert]');
  alert.textContent = value;
  alert.hidden = !value;
};
function saveAndRender(text) {
  saveLocal();
  message = text + (message === 'Đã áp dụng thay đổi cho phiên hiện tại.' ? ' Trình duyệt không lưu được thay đổi.' : '');
  render();
}

function topServices(active) {
  const counts = new Map();
  for (const row of active) {
    const name = find('service_templates', row.template_id, 'name');
    const title = name === '—' ? row.service_name : name;
    const key = serviceKey(title);
    if (!counts.has(key)) counts.set(key, { title, total: 0 });
    counts.get(key).total++;
  }
  const top = [...counts.values()].sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'vi')).slice(0, 5);
  return panel('Top 5 dịch vụ đang được đăng ký', top.map(({ title, total }, index) =>
    recordLine(title, 'Hạng ' + (index + 1), '<strong>' + total + ' gói</strong>')).join('') || emptyText('Chưa có gói đang hoạt động.'));
}

function promotedServices() {
  const existing = new Set(data.service_templates.map((row) => serviceKey(row.name)));
  const grouped = new Map();
  for (const row of data.subscriptions) {
    const key = serviceKey(row.service_name);
    if (row.template_id != null || existing.has(key)) continue;
    if (!grouped.has(key)) grouped.set(key, { key, name: row.service_name.trim(), category: row.category_id, count: 0 });
    grouped.get(key).count++;
  }
  return [...grouped.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
}

function promotionView() {
  return panel('Dịch vụ người dùng hay nhập', promotedServices().map((item) => recordLine(item.name,
    item.count + ' lượt nhập · ' + find('categories', item.category, 'name'),
    '<a class="secondary" href="#templates?promote=' + encodeURIComponent(item.key) + '">Chuyển thành kho mẫu</a>'
  )).join('') || emptyText('Không còn dịch vụ tự nhập cần đưa vào kho.'));
}

function userView(id) {
  const user = data.users.find((row) => String(row.id) === id);
  if (!user) return emptyText('Không tìm thấy tài khoản.');
  return '<div class="page-actions actions"><a href="#users">Về danh sách</a><a class="secondary" href="#subscriptions?user=' + user.id +
    '">Xem gói của người dùng</a></div>' + panel(user.full_name,
    recordLine('Email', user.email) +
    recordLine('Trạng thái', user.is_active ? 'Đang hoạt động' : 'Đã khóa tạm thời') +
    recordLine('Telegram', user.telegram_linked ? 'Đã liên kết' : 'Chưa liên kết') +
    recordLine('Lịch .ics', user.ical_enabled ? 'Đã bật' : 'Chưa bật')) +
    (user.role === 'user' ? '<button class="danger" data-toggle-user="' + user.id + '">' +
      (user.is_active ? 'Khóa tạm thời' : 'Mở khóa tài khoản') + '</button>' + userSupport(user.id) : '');
}

function aiLogView(id) {
  const log = data.ai_ingestion_logs.find((row) => String(row.id) === id);
  if (!log) return emptyText('Không tìm thấy nhật ký.');
  return '<div class="page-actions"><a href="#ingestion-logs">Về nhật ký bóc tách</a></div>' +
    panel('Lượt bóc tách #' + log.id, recordLine(find('users', log.user_id, 'full_name'), statuses[log.status]) +
      (log.error_message ? recordLine('Lỗi bóc tách', log.error_message) : '')) +
    '<div class="overview-grid">' + panel('Nội dung gốc mẫu', '<pre class="data-preview">' + escapeHtml(log.input_preview ?? 'Không có dữ liệu gốc.') + '</pre>') +
    panel('JSON trích xuất mẫu', '<pre class="data-preview">' + escapeHtml(log.extracted_json ? JSON.stringify(log.extracted_json, null, 2) : 'Không có kết quả.') + '</pre>') + '</div>' + aiReviewView(log);
}

function audience(templateId) {
  const activeUsers = new Set(data.users.filter((user) => user.is_active && user.role === 'user').map((user) => user.id));
  return new Set(data.subscriptions.filter((row) => row.template_id === Number(templateId) && row.status === 'active' && activeUsers.has(row.user_id))
    .map((row) => row.user_id));
}
function priceAlertView() {
  const choices = Object.fromEntries(data.service_templates.map((template) => [template.id, template.name]));
  return panel('Cảnh báo theo mẫu dịch vụ', '<form class="fields editor" id="price-alert-form">' +
    '<label>Mẫu dịch vụ<select name="template" required><option value="">Chọn dịch vụ</option>' + options(choices, '') + '</select></label>' +
    '<label>Tiêu đề<input name="alert_title" required maxlength="120"></label><p class="muted wide" data-audience>Chọn dịch vụ để xem số người nhận.</p>' +
    '<label class="wide">Nội dung cảnh báo<textarea name="body" required maxlength="1000" rows="3"></textarea></label>' + formAlert +
    '<div class="wide"><button class="primary">Phát cảnh báo mẫu</button></div></form>') +
    panel('Lịch sử cảnh báo', data.price_alerts.map((alert) => recordLine(alert.title,
      alert.template_name + ' · ' + alert.recipient_ids.length + ' người nhận mô phỏng · ' + date(alert.created_at) + ' · ' + alert.body
    )).join('') || emptyText('Chưa có cảnh báo.'));
}

function tipsView(id) {
  const tip = data.saving_tips.find((row) => String(row.id) === id);
  const placements = { dashboard: 'Dashboard', analytics: 'Phân tích', both: 'Cả hai màn hình' };
  return panel(tip ? 'Sửa mẹo tiết kiệm' : 'Thêm mẹo tiết kiệm', '<form class="fields editor" id="tip-form" data-id="' + (tip?.id ?? '') + '">' +
    '<label>Tiêu đề<input name="tip_title" required maxlength="120" value="' + escapeHtml(tip?.title ?? '') + '"></label>' +
    '<label>Vị trí<select name="place">' + options(placements, tip?.place ?? 'dashboard') + '</select></label>' +
    '<label class="wide">Nội dung<textarea name="body" rows="3" required maxlength="750">' + escapeHtml(tip?.body ?? '') + '</textarea></label>' + formAlert +
    '<div class="wide actions"><label class="check-label"><input type="checkbox" name="published"' + (tip?.published ? ' checked' : '') +
    '>Hiển thị trong cấu hình demo</label><button class="primary">Lưu mẹo</button>' + (tip ? '<a href="#saving-tips">Tạo mẹo mới</a>' : '') + '</div></form>') +
    panel('Danh sách mẹo', data.saving_tips.map((row) => recordLine(row.title,
      placements[row.place] + ' · ' + (row.published ? 'Đã bật' : 'Bản nháp') + ' · ' + row.body,
      '<div class="actions"><a href="#saving-tips/' + row.id + '">Sửa</a><button class="danger" data-delete-tip="' + row.id + '">Xóa</button></div>'
    )).join('') || emptyText('Chưa có mẹo.'));
}

const sampleVariables = { service_name: 'Spotify', amount: '59.000 ₫', days_left: '3' };
const renderMessage = (template, variables) => template.replace(/\{([^{}]+)\}/g, (match, key) =>
  Object.hasOwn(variables, key) ? variables[key] : match);
function messageTemplateView() {
  const model = data.notification_templates[0];
  return panel('Nội dung thông báo', '<form class="fields editor" id="message-form">' +
    '<label class="wide">Nhắc gia hạn<textarea name="renewal" rows="3" maxlength="500" required>' + escapeHtml(model.renewal) + '</textarea></label>' +
    '<label class="wide">Sắp hết dùng thử<textarea name="trial" rows="3" maxlength="500" required>' + escapeHtml(model.trial) + '</textarea></label>' +
    '<p class="muted wide">Biến hỗ trợ: {service_name}, {amount}, {days_left}</p>' + formAlert +
    '<div class="wide actions"><button class="primary">Lưu mẫu</button><button type="button" data-preview-message>Gửi thử Telegram mô phỏng</button></div>' +
    '<div class="wide" data-message-output aria-live="polite"></div></form>');
}

function backupView() {
  return panel('Sao lưu và khôi phục JSON', '<div class="fields editor"><p class="wide muted">Tệp chứa mẫu dịch vụ, danh mục và tỷ giá. Nhập tệp sẽ thay thế ba danh mục cấu hình trong trình duyệt.</p>' +
    '<div class="wide"><button type="button" class="primary" data-export-backup>Tải tệp JSON</button></div>' +
    '<form class="fields wide" id="backup-form"><label>Tệp cấu hình<input type="file" name="backup" accept=".json,application/json" required></label>' +
    formAlert + '<div><button>Kiểm tra và nhập tệp</button></div></form></div>');
}

function backupData(file) {
  if (!file || typeof file !== 'object' || file.version !== 1 || !file.tables) throw new Error('Tệp phải là bản sao lưu BillTrack phiên bản 1.');
  const { categories, service_templates, exchange_rates } = file.tables;
  for (const table of [categories, service_templates, exchange_rates]) {
    if (!Array.isArray(table) || table.length > 1000 || table.some((row) => !row || !Number.isSafeInteger(row.id) || row.id < 1) ||
        new Set(table.map((row) => row.id)).size !== table.length) throw new Error('Mỗi bảng phải có tối đa 1.000 bản ghi với ID hợp lệ và duy nhất.');
  }
  const categoryIds = new Set(categories.map((row) => row.id));
  const templateIds = new Set(service_templates.map((row) => row.id));
  if (categories.some((row) => !textValue(row.name, 100) || !slugValue(row.slug) || !textValue(row.icon, 100) ||
      !isColor(row.color_hex) || !Number.isSafeInteger(row.sort_order) || row.sort_order < 0) ||
      new Set(categories.map((row) => row.slug)).size !== categories.length) throw new Error('Danh mục có trường dữ liệu không hợp lệ hoặc trùng đường dẫn.');
  if (service_templates.some((row) => !textValue(row.name, 150) || !slugValue(row.slug) || !categoryIds.has(row.category_id) ||
      !flag(row.is_active) || (row.brand_color && !isColor(row.brand_color)) ||
      [row.logo_url, row.official_cancel_url].some((url) => url && !validWebUrl(url)) ||
      !optionalText(row.cancel_instructions, 1500) || !optionalText(row.perks, 1500) ||
      !Array.isArray(row.plans_json) || row.plans_json.some((plan) => !validPlan(plan))) ||
      new Set(service_templates.map((row) => row.slug)).size !== service_templates.length) throw new Error('Kho mẫu có trường không hợp lệ, trùng đường dẫn hoặc thiếu danh mục.');
  if (exchange_rates.some((row) => !currencyValue(row.currency_code) || !Number.isFinite(row.rate_to_vnd) ||
      row.rate_to_vnd <= 0 || !textValue(row.source_bank, 100) || typeof row.fetched_at !== 'string' ||
      !Number.isFinite(Date.parse(row.fetched_at)))) throw new Error('Tỷ giá có trường dữ liệu không hợp lệ.');
  if (data.subscriptions.some((row) => (row.category_id != null && !categoryIds.has(row.category_id)) ||
      (row.template_id != null && !templateIds.has(row.template_id)))) throw new Error('Tệp thiếu danh mục hoặc mẫu được dùng bởi gói đang lưu.');
  return { categories, service_templates, exchange_rates };
}

function exportBackup() {
  const tables = Object.fromEntries(configTables.map((table) => [table, data[table]]));
  const blob = new Blob([JSON.stringify({ version: 1, tables }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'billtrack-config.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const auditAreas = {
  account: 'Tài khoản', subscription: 'Gói đăng ký', billing: 'Chia hóa đơn',
  notification: 'Thông báo', catalog: 'Cấu hình', ingestion: 'Kiểm định AI', support: 'Hỗ trợ',
};
const timestamp = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

function audit(area, operation, target) {
  data.audit_events.unshift({ area, operation, target, at: new Date().toISOString() });
  if (data.audit_events.length > 300) data.audit_events.length = 300;
}

function auditView() {
  return panel('Thao tác quản trị', '<form class="search dataset-search" id="audit-filter">' +
    '<input type="search" name="query" aria-label="Tìm thao tác hoặc mã bản ghi" placeholder="Tìm thao tác hoặc mã bản ghi">' +
    '<select name="area" aria-label="Nhóm thao tác"><option value="">Mọi nhóm</option>' + options(auditAreas, '') +
    '</select><button>Lọc nhật ký</button></form><div class="table-wrap" tabindex="0"><table><thead><tr>' +
    '<th scope="col">Thời điểm</th><th scope="col">Người thực hiện</th><th scope="col">Nhóm</th>' +
    '<th scope="col">Thao tác</th><th scope="col">Bản ghi</th></tr></thead><tbody data-audit-rows></tbody></table></div>');
}

const caseTopics = { billing: 'Thanh toán', account: 'Tài khoản', data: 'Dữ liệu gói', other: 'Khác' };
const casePriorities = { normal: 'Thông thường', high: 'Ưu tiên cao' };
function supportCases(userId) {
  const cases = data.support_cases.filter((row) => userId == null || row.user_id === userId);
  return cases.length ? cases.map((row) => recordLine(row.title,
    '#' + row.id + ' · ' + caseTopics[row.topic] + ' · ' + casePriorities[row.priority] +
    ' · ' + (row.closed_at ? 'Đã giải quyết' : 'Đang mở') + (userId == null ? ' · ' + find('users', row.user_id, 'full_name') : ''),
    '<a class="secondary" href="#support/' + row.id + '">Xem yêu cầu</a>')).join('') : emptyText('Chưa có yêu cầu hỗ trợ.');
}

function supportView(id) {
  if (!id) {
    return panel('Đang chờ xử lý', '<div class="inset-note">' + data.support_cases.filter((row) => !row.closed_at).length +
      ' yêu cầu đang mở. Mở hồ sơ người dùng để tạo yêu cầu mới.</div>') + panel('Tất cả yêu cầu', supportCases(null));
  }
  const row = data.support_cases.find((item) => String(item.id) === id);
  if (!row) return emptyText('Không tìm thấy yêu cầu hỗ trợ.');
  return '<div class="page-actions actions"><a href="#support">Về danh sách yêu cầu</a><a href="#users/' + row.user_id +
    '">Hồ sơ người dùng</a></div>' + panel(row.title,
    recordLine('Người dùng', find('users', row.user_id, 'full_name')) +
    recordLine('Phân loại', caseTopics[row.topic] + ' · ' + casePriorities[row.priority]) +
    recordLine('Tạo lúc', timestamp.format(new Date(row.created_at))) +
    recordLine('Nội dung', row.body) +
    (row.closed_at ? recordLine('Đã giải quyết', row.resolution) :
      '<form class="fields editor" id="resolve-support" data-id="' + row.id + '"><label class="wide">Kết quả xử lý' +
      '<textarea name="resolution" rows="3" maxlength="700" required></textarea></label>' + formAlert +
      '<div class="wide"><button class="primary">Đóng yêu cầu</button></div></form>'));
}

function userSupport(id) {
  return panel('Hỗ trợ tài khoản', supportCases(id) +
    '<form class="fields editor" id="open-support" data-user="' + id + '">' +
    '<label>Tiêu đề<input name="case_title" maxlength="120" required></label>' +
    '<label>Phân loại<select name="topic">' + options(caseTopics, 'billing') + '</select></label>' +
    '<label>Ưu tiên<select name="priority">' + options(casePriorities, 'normal') + '</select></label>' +
    '<label class="wide">Ghi chú nội bộ<textarea name="body" rows="3" maxlength="900" required></textarea></label>' + formAlert +
    '<div class="wide"><button class="primary">Tạo yêu cầu hỗ trợ</button></div></form>');
}

function reviewFor(id) {
  return data.ai_reviews.find((row) => row.log_id === id);
}

function aiReviewView(log) {
  const review = reviewFor(log.id);
  if (review) {
    return panel(review.decision === 'approved' ? 'Đã duyệt kết quả' : 'Đã yêu cầu xử lý lại',
      recordLine('Ghi chú kiểm định', review.note) + recordLine('Thời điểm', timestamp.format(new Date(review.at))) +
      (review.output ? '<pre class="data-preview">' + escapeHtml(JSON.stringify(review.output, null, 2)) + '</pre>' : '') +
      '<div class="inset-note"><button data-reopen-review="' + log.id + '">Mở lại kiểm định</button></div>');
  }
  if (log.status === 'pending') return panel('Kiểm định', emptyText('Lượt quét đang chờ xử lý.'));
  return panel('Kiểm định thủ công', '<form class="fields editor" id="ai-review" data-id="' + log.id + '">' +
    '<label>Kết quả<select name="decision"><option value="approved">Duyệt JSON</option><option value="rejected">Yêu cầu xử lý lại</option></select></label>' +
    '<label class="wide">JSON sau kiểm định<textarea name="output" rows="6" maxlength="3500">' +
    escapeHtml(log.extracted_json ? JSON.stringify(log.extracted_json, null, 2) : '') + '</textarea></label>' +
    '<label class="wide">Ghi chú kiểm định<textarea name="note" rows="2" maxlength="700" required></textarea></label>' + formAlert +
    '<div class="wide"><button class="primary">Lưu kiểm định</button></div></form>');
}

function operationsView() {
  const reviews = data.ai_ingestion_logs.filter((row) => row.status !== 'pending' && !reviewFor(row.id));
  const support = data.support_cases.filter((row) => !row.closed_at)
    .sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high') || a.created_at.localeCompare(b.created_at));
  return '<div class="overview-grid">' +
    panel('Hóa đơn cần kiểm định', reviews.map((row) => recordLine('Lượt bóc tách #' + row.id, statuses[row.status],
      '<a class="secondary" href="#ingestion-logs/' + row.id + '">Kiểm định</a>')).join('') || emptyText('Đã kiểm định tất cả lượt có kết quả.')) +
    panel('Yêu cầu hỗ trợ đang mở', support.map((row) => recordLine(row.title, casePriorities[row.priority],
      '<a class="secondary" href="#support/' + row.id + '">Xử lý</a>')).join('') || emptyText('Không có yêu cầu đang mở.')) +
    '</div>';
}

function bindWorkflowOperations() {
  const auditForm = root.querySelector('#audit-filter');
  if (auditForm) {
    const drawAudit = () => {
      const query = auditForm.elements.query.value.trim().toLocaleLowerCase('vi');
      const area = auditForm.elements.area.value;
      const rows = data.audit_events.filter((row) => (!area || row.area === area) &&
        (row.operation + ' ' + row.target).toLocaleLowerCase('vi').includes(query));
      root.querySelector('[data-audit-rows]').innerHTML = rows.map((row) => '<tr>' +
        [timestamp.format(new Date(row.at)), 'Quản trị BillTrack', auditAreas[row.area], row.operation, row.target]
          .map((value) => '<td>' + escapeHtml(value) + '</td>').join('') + '</tr>').join('') ||
        '<tr><td colspan="5" class="empty">Không có thao tác phù hợp.</td></tr>';
    };
    auditForm.addEventListener('input', drawAudit);
    auditForm.addEventListener('submit', (event) => { event.preventDefault(); drawAudit(); });
    drawAudit();
  }
  const supportForm = root.querySelector('#open-support');
  supportForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const userId = Number(supportForm.dataset.user);
    const values = new FormData(supportForm);
    const title = values.get('case_title').trim();
    const body = values.get('body').trim();
    const topic = values.get('topic');
    const priority = values.get('priority');
    if (!data.users.some((user) => user.id === userId && user.role === 'user') ||
      !textValue(title, 120) || !textValue(body, 900) || !Object.hasOwn(caseTopics, topic) || !Object.hasOwn(casePriorities, priority)) {
      setFormError(supportForm, 'Kiểm tra tiêu đề, phân loại, ưu tiên và ghi chú.');
      return;
    }
    const id = nextRecordId(data.support_cases);
    data.support_cases.unshift({ id, user_id: userId, title, body, topic, priority, created_at: new Date().toISOString() });
    audit('support', 'Tạo yêu cầu hỗ trợ', '#' + id);
    saveLocal();
    message = 'Đã tạo yêu cầu hỗ trợ.';
    window.location.hash = 'support/' + id;
  });
  const resolveForm = root.querySelector('#resolve-support');
  resolveForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const row = data.support_cases.find((item) => String(item.id) === resolveForm.dataset.id);
    const resolution = resolveForm.elements.resolution.value.trim();
    if (!row || row.closed_at || !textValue(resolution, 700)) {
      setFormError(resolveForm, 'Nhập kết quả xử lý trước khi đóng yêu cầu.');
      return;
    }
    row.resolution = resolution;
    row.closed_at = new Date().toISOString();
    audit('support', 'Đóng yêu cầu hỗ trợ', '#' + row.id);
    saveAndRender('Đã đóng yêu cầu hỗ trợ.');
  });
  const reviewForm = root.querySelector('#ai-review');
  reviewForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = Number(reviewForm.dataset.id);
    const log = data.ai_ingestion_logs.find((row) => row.id === id);
    const values = new FormData(reviewForm);
    const decision = values.get('decision');
    const note = values.get('note').trim();
    if (!log || log.status === 'pending' || reviewFor(id) || !['approved', 'rejected'].includes(decision) || !textValue(note, 700)) {
      setFormError(reviewForm, 'Chọn kết quả và nhập ghi chú kiểm định.');
      return;
    }
    let output = null;
    if (decision === 'approved') {
      try {
        const parsed = JSON.parse(values.get('output'));
        const next = parsed?.next_billing_date;
        const dueAt = /^\d{4}-\d{2}-\d{2}$/.test(next ?? '') ? new Date(next + 'T00:00:00Z') : null;
        if (!parsed || !textValue(parsed.service_name, 150) || !Number.isFinite(parsed.amount) || parsed.amount < 0 ||
          !currencyValue(parsed.currency) || !dueAt || !Number.isFinite(dueAt.getTime()) || dueAt.toISOString().slice(0, 10) !== next) {
          throw new Error('Invalid receipt fields');
        }
        output = { service_name: parsed.service_name.trim(), amount: parsed.amount, currency: parsed.currency, next_billing_date: next };
      } catch {
        setFormError(reviewForm, 'JSON cần tên dịch vụ, số tiền hợp lệ, tiền tệ và ngày gia hạn hợp lệ.');
        return;
      }
    }
    data.ai_reviews.unshift({ log_id: id, decision, note, output, at: new Date().toISOString() });
    audit('ingestion', decision === 'approved' ? 'Duyệt JSON' : 'Yêu cầu xử lý lại', '#' + id);
    saveAndRender('Đã lưu kết quả kiểm định.');
  });
  root.querySelector('[data-reopen-review]')?.addEventListener('click', (event) => {
    const id = Number(event.currentTarget.dataset.reopenReview);
    if (!reviewFor(id) || !window.confirm('Mở lại lượt kiểm định mẫu này?')) return;
    data.ai_reviews = data.ai_reviews.filter((row) => row.log_id !== id);
    audit('ingestion', 'Mở lại kiểm định', '#' + id);
    saveAndRender('Đã mở lại kiểm định.');
  });
}

const specialViews = {
  operations: () => operationsView(),
  support: (id) => supportView(id),
  audit: () => auditView(),
  promote: () => promotionView(),
  backup: () => backupView(),
  'price-alerts': () => priceAlertView(),
  'saving-tips': (id) => tipsView(id),
  'message-templates': () => messageTemplateView(),
};

function bindAdminOperations() {
  root.querySelector('[data-toggle-user]')?.addEventListener('click', (event) => {
    const user = data.users.find((row) => row.id === Number(event.currentTarget.dataset.toggleUser) && row.role === 'user');
    if (!user || !window.confirm(user.is_active ? 'Khóa tạm thời tài khoản mẫu này?' : 'Mở khóa tài khoản mẫu này?')) return;
    user.is_active = user.is_active ? 0 : 1;
    audit('account', user.is_active ? 'Mở khóa tài khoản' : 'Khóa tài khoản', '#' + user.id);
    saveAndRender(user.is_active ? 'Đã mở khóa tài khoản mẫu.' : 'Đã khóa tài khoản mẫu.');
  });
  root.querySelector('[data-sync-rates]')?.addEventListener('click', () => {
    if (!window.confirm('Nạp lại USD, EUR, JPY từ bộ tỷ giá mẫu?')) return;
    const time = new Date().toISOString().slice(0, 16);
    for (const reference of window.BillTrackDemoData.exchange_rates) {
      const existing = data.exchange_rates.find((row) => row.currency_code === reference.currency_code);
      const value = { rate_to_vnd: reference.rate_to_vnd, source_bank: 'Đồng bộ mẫu', fetched_at: time };
      if (existing) Object.assign(existing, value);
      else data.exchange_rates.push({ id: nextRecordId(data.exchange_rates), currency_code: reference.currency_code, ...value });
    }
    audit('catalog', 'Nạp lại tỷ giá mẫu', 'USD, EUR, JPY');
    saveAndRender('Đã nạp lại tỷ giá mẫu.');
  });
  const alertForm = root.querySelector('#price-alert-form');
  alertForm?.elements.template.addEventListener('change', () => {
    alertForm.querySelector('[data-audience]').textContent = 'Có ' + audience(alertForm.elements.template.value).size + ' người dùng đủ điều kiện nhận.';
  });
  alertForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(alertForm);
    const id = Number(values.get('template'));
    const title = values.get('alert_title').trim();
    const body = values.get('body').trim();
    const recipients = [...audience(id)];
    if (!recipients.length || !textValue(title, 120) || !textValue(body, 1000)) {
      setFormError(alertForm, 'Nhập tiêu đề, nội dung và chọn dịch vụ có người đang đăng ký.');
      return;
    }
    data.price_alerts.unshift({ title, body, template_name: find('service_templates', id, 'name'), recipient_ids: recipients, created_at: new Date().toISOString() });
    audit('notification', 'Tạo cảnh báo tăng giá', 'Mẫu #' + id);
    saveAndRender('Đã tạo cảnh báo cho ' + recipients.length + ' người dùng trong demo.');
  });
  const tipForm = root.querySelector('#tip-form');
  tipForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(tipForm);
    const title = values.get('tip_title').trim();
    const body = values.get('body').trim();
    const place = values.get('place');
    if (!textValue(title, 120) || !textValue(body, 750) || !['dashboard', 'analytics', 'both'].includes(place)) {
      setFormError(tipForm, 'Nhập đầy đủ tiêu đề, nội dung và vị trí.');
      return;
    }
    const id = Number(tipForm.dataset.id) || nextRecordId(data.saving_tips);
    const tip = { id, title, body, place, published: values.has('published') };
    data.saving_tips = [tip, ...data.saving_tips.filter((row) => row.id !== id)];
    audit('catalog', 'Lưu mẹo tiết kiệm', '#' + id);
    saveAndRender('Đã lưu mẹo trong cấu hình demo.');
  });
  root.querySelectorAll('[data-delete-tip]').forEach((button) => button.addEventListener('click', () => {
    if (!window.confirm('Xóa mẹo này khỏi cấu hình demo?')) return;
    data.saving_tips = data.saving_tips.filter((row) => row.id !== Number(button.dataset.deleteTip));
    audit('catalog', 'Xóa mẹo tiết kiệm', '#' + button.dataset.deleteTip);
    saveAndRender('Đã xóa mẹo.');
  }));
  const messageForm = root.querySelector('#message-form');
  messageForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(messageForm);
    const templates = { renewal: values.get('renewal').trim(), trial: values.get('trial').trim() };
    if (Object.values(templates).some((value) => !textValue(value, 500) ||
        [...value.matchAll(/\{([^{}]+)\}/g)].some((match) => !Object.hasOwn(sampleVariables, match[1])))) {
      setFormError(messageForm, 'Kiểm tra nội dung và tên các biến trong mẫu.');
      return;
    }
    data.notification_templates = [templates];
    audit('notification', 'Cập nhật mẫu thông báo', 'Gia hạn và dùng thử');
    saveAndRender('Đã lưu mẫu thông báo.');
  });
  messageForm?.querySelector('[data-preview-message]').addEventListener('click', () => {
    const preview = messageForm.querySelector('[data-message-output]');
    preview.innerHTML = '<p><strong>Kết quả mô phỏng Telegram</strong></p><p>' +
      escapeHtml(renderMessage(messageForm.elements.renewal.value, sampleVariables)) + '</p><p>' +
      escapeHtml(renderMessage(messageForm.elements.trial.value, sampleVariables)) + '</p><p class="muted">Chưa kết nối bot Telegram.</p>';
  });
  root.querySelector('[data-export-backup]')?.addEventListener('click', exportBackup);
  const backupForm = root.querySelector('#backup-form');
  backupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = backupForm.elements.backup.files?.[0];
    try {
      if (!input || input.size > 2000000) throw new Error('Chọn tệp JSON có dung lượng tối đa 2 MB.');
      const tables = backupData(JSON.parse(await input.text()));
      if (!backupForm.isConnected || !window.confirm('Thay thế kho mẫu, danh mục và tỷ giá bằng dữ liệu trong tệp?')) return;
      Object.assign(data, tables);
      audit('catalog', 'Khôi phục cấu hình', 'Kho mẫu, danh mục và tỷ giá');
      saveAndRender('Đã khôi phục ba bảng cấu hình.');
    } catch (error) {
      setFormError(backupForm, error instanceof SyntaxError ? 'Tệp JSON không hợp lệ.' : error.message);
    }
  });
}

function render() {
  if (!signedIn) {
    showLogin();
    return;
  }
  const [hashPath, query] = window.location.hash.slice(1).split('?');
  const [requested, detail] = hashPath.split('/');
  const params = new URLSearchParams(query);
  const current = Object.hasOwn(sections, requested) ? requested : 'overview';
  const section = sections[current];
  const showSubscription = current === 'subscriptions' && Boolean(detail);
  const showSplit = current === 'groups' && detail === 'new';
  const userDetail = current === 'users' && Boolean(detail);
  const logDetail = current === 'ingestion-logs' && Boolean(detail);
  const special = specialViews[current];
  const row = showSubscription ? data.subscriptions.find((item) => String(item.id) === detail) : null;
  const title = showSplit ? 'Chia hóa đơn' : showSubscription ? (row?.service_name ?? 'Chi tiết gói') : (section?.title ?? 'Tổng quan');
  const content = showSubscription ? subscriptionDetail(row) : showSplit ? splitEditor(params.get('subscription')) :
    current === 'notifications' ? notifications() : userDetail ? userView(detail) : logDetail ? aiLogView(detail) :
    special ? special(detail) : section ? list(section, params) : overview();
  document.title = title + ' · BillTrack Demo';
  root.innerHTML = '<div class="shell"><aside class="sidebar"><a class="brand" href="#overview">' + brand +
    '</a><nav aria-label="Quản trị">' + nav(current) + '</nav><form id="signout"><button>Đăng xuất</button></form></aside>' +
    '<div class="workspace"><header class="topbar"><span>Quản trị nội dung · Dữ liệu mẫu</span><strong>Quản trị BillTrack</strong></header>' +
    '<main><h1>' + escapeHtml(title) + '</h1>' + (message ? '<p class="status" role="status">' + escapeHtml(message) + '</p>' : '') +
    content + '</main></div></div>';
  message = '';
  root.querySelector('#signout').addEventListener('submit', (event) => {
    event.preventDefault();
    signedIn = false;
    try { sessionStorage.removeItem(sessionKey); } catch { /* fallback to memory */ }
    render();
  });
  bindOperations();
  bindAdminOperations();
  bindWorkflowOperations();
  if (section && !showSubscription && !showSplit && !userDetail && !logDetail && !special && current !== 'notifications') bindSection(section, params);
}

window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
});
render();
