/* Dữ liệu giả lập cho bản trình diễn. Không chứa dữ liệu tài khoản thật. */
window.BillTrackDemoData = {
  users: [
    { id: 1, full_name: 'Quản trị BillTrack', email: 'admin-demo@billtrack.local', role: 'admin', default_currency: 'VND', is_active: 1, created_at: '2026-11-01' },
    { id: 2, full_name: 'Khánh Huy', email: 'huy@billtrack.example', role: 'user', default_currency: 'VND', is_active: 1, created_at: '2026-11-05' },
    { id: 3, full_name: 'Minh Anh', email: 'minhanh@billtrack.example', role: 'user', default_currency: 'VND', is_active: 1, created_at: '2026-11-08' },
  ],
  categories: [
    { id: 1, name: 'Giải trí', slug: 'giai-tri', icon: 'play', color_hex: '#8B2E2E', sort_order: 1 },
    { id: 2, name: 'Âm nhạc', slug: 'am-nhac', icon: 'music', color_hex: '#50755C', sort_order: 2 },
    { id: 3, name: 'AI & Công việc', slug: 'ai-cong-viec', icon: 'cpu', color_hex: '#74578B', sort_order: 3 },
    { id: 4, name: 'Lưu trữ Cloud', slug: 'luu-tru-cloud', icon: 'cloud', color_hex: '#347997', sort_order: 4 },
  ],
  service_templates: [
    { id: 1, category_id: 1, name: 'YouTube Premium', slug: 'youtube-premium', is_active: 1, plans_json: [{ name: 'Family', amount: 149000, currency: 'VND', cycle: 'monthly' }] },
    { id: 2, category_id: 2, name: 'Spotify', slug: 'spotify', is_active: 1, plans_json: [{ name: 'Cá nhân', amount: 59000, currency: 'VND', cycle: 'monthly' }] },
    { id: 3, category_id: 3, name: 'ChatGPT Plus', slug: 'chatgpt-plus', is_active: 1, plans_json: [{ name: 'Plus', amount: 20, currency: 'USD', cycle: 'monthly' }] },
    { id: 4, category_id: 4, name: 'iCloud+', slug: 'icloud', is_active: 1, plans_json: [{ name: '200 GB', amount: 69000, currency: 'VND', cycle: 'monthly' }] },
    { id: 5, category_id: 1, name: 'Netflix', slug: 'netflix', is_active: 1, plans_json: [{ name: 'Tiêu chuẩn', amount: 220000, currency: 'VND', cycle: 'monthly' }] },
  ],
  payment_methods: [
    { id: 1, user_id: 2, provider_name: 'Techcombank Visa', method_type: 'card', last_four_digits: '4512', is_locked: 0 },
    { id: 2, user_id: 2, provider_name: 'MoMo', method_type: 'ewallet', last_four_digits: '8899', is_locked: 0 },
    { id: 3, user_id: 3, provider_name: 'Vietcombank', method_type: 'bank', last_four_digits: '2608', is_locked: 1 },
  ],
  subscriptions: [
    { id: 1, user_id: 2, category_id: 1, payment_method_id: 1, template_id: 1, service_name: 'YouTube Premium', plan_name: 'Family', amount: 149000, currency: 'VND', amount_vnd: 149000, billing_cycle: 'monthly', due_in_days: 5, is_free_trial: 0, price_hike_flagged: 0, status: 'active' },
    { id: 2, user_id: 2, category_id: 2, payment_method_id: 2, template_id: 2, service_name: 'Spotify', plan_name: 'Cá nhân', amount: 59000, currency: 'VND', amount_vnd: 59000, billing_cycle: 'monthly', due_in_days: 7, is_free_trial: 0, price_hike_flagged: 0, status: 'active' },
    { id: 3, user_id: 2, category_id: 3, payment_method_id: 1, template_id: 3, service_name: 'ChatGPT Plus', plan_name: 'Plus', amount: 20, currency: 'USD', amount_vnd: 509000, billing_cycle: 'monthly', due_in_days: 12, is_free_trial: 0, price_hike_flagged: 1, status: 'active' },
    { id: 4, user_id: 3, category_id: 4, payment_method_id: 3, template_id: 4, service_name: 'iCloud+', plan_name: '200 GB', amount: 69000, currency: 'VND', amount_vnd: 69000, billing_cycle: 'monthly', due_in_days: 2, is_free_trial: 1, price_hike_flagged: 0, status: 'active' },
    { id: 5, user_id: 3, category_id: 1, payment_method_id: 3, template_id: 5, service_name: 'Netflix', plan_name: 'Tiêu chuẩn', amount: 220000, currency: 'VND', amount_vnd: 220000, billing_cycle: 'monthly', due_in_days: 15, is_free_trial: 0, price_hike_flagged: 0, status: 'paused' },
  ],
  subscription_histories: [
    { id: 1, subscription_id: 3, billed_date: '2026-11-15', previous_amount: 18, amount: 20, currency: 'USD', is_price_hike: 1, source_type: 'ai_text' },
    { id: 2, subscription_id: 2, billed_date: '2026-11-10', previous_amount: 59000, amount: 59000, currency: 'VND', is_price_hike: 0, source_type: 'manual' },
  ],
  subscription_groups: [
    { id: 1, subscription_id: 1, host_user_id: 2, group_name: 'YouTube Gia đình', split_mode: 'equal', created_at: '2026-11-08' },
  ],
  group_splits: [
    { id: 1, group_id: 1, member_name: 'Khánh Huy', billing_period: '11/2026', amount_due: 74500, payment_status: 'paid', paid_at: '2026-11-20' },
    { id: 2, group_id: 1, member_name: 'Minh Anh', billing_period: '11/2026', amount_due: 74500, payment_status: 'unpaid', paid_at: null },
  ],
  exchange_rates: [
    { id: 1, currency_code: 'USD', rate_to_vnd: 25450, source_bank: 'Dữ liệu mẫu', fetched_at: '2026-11-24T09:00' },
    { id: 2, currency_code: 'EUR', rate_to_vnd: 26890, source_bank: 'Dữ liệu mẫu', fetched_at: '2026-11-24T09:00' },
    { id: 3, currency_code: 'JPY', rate_to_vnd: 165.5, source_bank: 'Dữ liệu mẫu', fetched_at: '2026-11-24T09:00' },
  ],
  ai_ingestion_logs: [
    { id: 1, user_id: 2, subscription_id: 3, input_type: 'email_text', status: 'processed', created_at: '2026-11-23' },
    { id: 2, user_id: 3, subscription_id: null, input_type: 'receipt_image', status: 'pending', created_at: '2026-11-24' },
    { id: 3, user_id: 2, subscription_id: null, input_type: 'receipt_image', status: 'failed', created_at: '2026-11-24' },
  ],
};
const sample = window.BillTrackDemoData;
Object.assign(sample.service_templates[0], {
  brand_color: '#FF0033',
  official_cancel_url: 'https://www.youtube.com/paid_memberships',
  cancel_instructions: 'Mở Quản lý gói thành viên.\nChọn Hủy kích hoạt và làm theo hướng dẫn.',
  perks: 'YouTube Premium bao gồm YouTube Music Premium.',
});
Object.assign(sample.service_templates[1], { brand_color: '#1DB954' });
Object.assign(sample.service_templates[2], { brand_color: '#237760' });
Object.assign(sample.service_templates[3], { brand_color: '#3686CE' });
Object.assign(sample.service_templates[4], { brand_color: '#E50914' });
sample.service_templates.push({
  id: 6, category_id: 3, name: 'Adobe', slug: 'adobe', brand_color: '#DC2525', is_active: 1,
  plans_json: [{ name: 'Creative Cloud', amount: 34.99, currency: 'USD', cycle: 'monthly' }],
});
Object.assign(sample.users[1], { telegram_linked: true, ical_enabled: true });
Object.assign(sample.users[2], { telegram_linked: false, ical_enabled: true });
for (const [id, user_id, service_name] of [[6, 2, 'VieON'], [7, 3, 'vieon'], [8, 2, 'FPT Play']]) {
  sample.subscriptions.push({ id, user_id, service_name, template_id: null, category_id: 1, amount: 79000,
    amount_vnd: 79000, currency: 'VND', billing_cycle: 'monthly', due_in_days: 14, status: 'active' });
}
Object.assign(sample.ai_ingestion_logs[0], {
  input_preview: 'Biên nhận mẫu ChatGPT Plus\nTổng cộng USD 20\nGia hạn ngày 15/12/2026',
  extracted_json: { service_name: 'ChatGPT Plus', amount: 20, currency: 'USD', next_billing_date: '2026-12-15' },
});
Object.assign(sample.ai_ingestion_logs[2], {
  input_preview: 'Ảnh hóa đơn mẫu có vùng số tiền bị mờ.',
  error_message: 'Chưa nhận diện được số tiền và ngày gia hạn.',
});
