<?php

return [
    'users' => [
        'title' => 'Người dùng', 'description' => 'Theo dõi tài khoản, quyền và trạng thái hoạt động.',
        'table' => 'users',
        'columns' => ['full_name' => ['Họ tên', 'r.full_name'], 'email' => ['Email', 'r.email'], 'role' => ['Quyền', 'r.role'], 'currency' => ['Tiền tệ', 'r.default_currency'], 'active' => ['Trạng thái', 'r.is_active'], 'created' => ['Ngày tạo', 'r.created_at']],
        'search' => ['r.full_name', 'r.email'], 'filter' => ['r.role', ['user' => 'Người dùng', 'admin' => 'Quản trị']],
    ],
    'subscriptions' => [
        'title' => 'Gói đăng ký', 'description' => 'Theo dõi gói định kỳ, kỳ gia hạn, thử miễn phí và cảnh báo tăng giá.',
        'table' => 'subscriptions',
        'joins' => [['users as u', 'u.id', 'r.user_id'], ['categories as c', 'c.id', 'r.category_id'], ['payment_methods as p', 'p.id', 'r.payment_method_id']],
        'columns' => ['service' => ['Dịch vụ', 'r.service_name'], 'plan' => ['Gói cước', 'r.plan_name'], 'user' => ['Người dùng', 'u.full_name'], 'category' => ['Danh mục', 'c.name'], 'provider' => ['Nguồn tiền', 'p.provider_name'], 'amount' => ['Giá gốc', 'r.amount'], 'currency' => ['Tiền tệ', 'r.currency'], 'amount_vnd' => ['Quy đổi VND', 'r.amount_vnd'], 'cycle' => ['Chu kỳ', 'r.billing_cycle'], 'due' => ['Gia hạn', 'r.next_billing_date'], 'trial' => ['Dùng thử', 'r.is_free_trial'], 'hike' => ['Tăng giá', 'r.price_hike_flagged'], 'status' => ['Trạng thái', 'r.status']],
        'search' => ['r.service_name', 'r.plan_name', 'u.full_name', 'c.name'], 'filter' => ['r.status', ['active' => 'Đang hoạt động', 'paused' => 'Tạm dừng', 'cancelled' => 'Đã hủy', 'expired' => 'Hết hạn']],
        'exclude_deleted' => true,
    ],
    'payment-methods' => [
        'title' => 'Nguồn thanh toán', 'description' => 'Xem thẻ, tài khoản và ví điện tử đã được gắn vào BillTrack.',
        'table' => 'payment_methods', 'joins' => [['users as u', 'u.id', 'r.user_id']],
        'columns' => ['provider' => ['Nhà cung cấp', 'r.provider_name'], 'user' => ['Người dùng', 'u.full_name'], 'type' => ['Loại', 'r.method_type'], 'ending' => ['Số cuối', 'r.last_four_digits'], 'locked' => ['Trạng thái', 'r.is_locked']],
        'search' => ['r.provider_name', 'u.full_name', 'r.last_four_digits'], 'filter' => ['r.method_type', ['card' => 'Thẻ', 'bank' => 'Ngân hàng', 'ewallet' => 'Ví điện tử']],
    ],
    'groups' => [
        'title' => 'Nhóm chia sẻ', 'description' => 'Xem nhóm, chủ nhóm và gói đăng ký dùng chung.',
        'table' => 'subscription_groups', 'joins' => [['users as u', 'u.id', 'r.host_user_id'], ['subscriptions as s', 's.id', 'r.subscription_id']],
        'columns' => ['group_name' => ['Tên nhóm', 'r.group_name'], 'user' => ['Chủ nhóm', 'u.full_name'], 'service' => ['Dịch vụ', 's.service_name'], 'mode' => ['Cách chia', 'r.split_mode'], 'created' => ['Ngày tạo', 'r.created_at']],
        'search' => ['r.group_name', 'u.full_name', 's.service_name'], 'filter' => ['r.split_mode', ['equal' => 'Chia đều', 'custom' => 'Tùy chỉnh']],
    ],
    'group-splits' => [
        'title' => 'Khoản chia nhóm', 'description' => 'Theo dõi số tiền cần đóng và tình trạng thanh toán từng thành viên.',
        'table' => 'group_splits', 'joins' => [['subscription_groups as g', 'g.id', 'r.group_id']],
        'columns' => ['member' => ['Thành viên', 'r.member_name'], 'group_name' => ['Nhóm', 'g.group_name'], 'period' => ['Kỳ thanh toán', 'r.billing_period'], 'amount_vnd' => ['Số tiền', 'r.amount_due'], 'status' => ['Trạng thái', 'r.payment_status'], 'paid_at' => ['Ngày đóng', 'r.paid_at']],
        'search' => ['r.member_name', 'g.group_name', 'r.billing_period'], 'filter' => ['r.payment_status', ['unpaid' => 'Chưa đóng', 'paid' => 'Đã đóng']],
    ],
    'billing-history' => [
        'title' => 'Lịch sử hóa đơn', 'description' => 'Đối chiếu giá kỳ trước, giá kỳ này và nguồn ghi nhận hóa đơn.',
        'table' => 'subscription_histories', 'joins' => [['subscriptions as s', 's.id', 'r.subscription_id']],
        'columns' => ['service' => ['Dịch vụ', 's.service_name'], 'due' => ['Ngày hóa đơn', 'r.billed_date'], 'previous' => ['Giá trước', 'r.previous_amount'], 'amount' => ['Giá kỳ này', 'r.amount'], 'currency' => ['Tiền tệ', 'r.currency'], 'hike' => ['Tăng giá', 'r.is_price_hike'], 'source' => ['Nguồn', 'r.source_type']],
        'search' => ['s.service_name', 'r.currency'], 'filter' => ['r.source_type', ['manual' => 'Thủ công', 'ai_text' => 'AI văn bản', 'ai_ocr' => 'AI OCR']],
    ],
    'ingestion-logs' => [
        'title' => 'Nhật ký bóc tách', 'description' => 'Theo dõi tiến độ xử lý văn bản email và ảnh hóa đơn.',
        'table' => 'ai_ingestion_logs', 'joins' => [['users as u', 'u.id', 'r.user_id'], ['subscriptions as s', 's.id', 'r.subscription_id']],
        'columns' => ['user' => ['Người dùng', 'u.full_name'], 'service' => ['Dịch vụ', 's.service_name'], 'source' => ['Đầu vào', 'r.input_type'], 'status' => ['Trạng thái', 'r.status'], 'created' => ['Thời điểm', 'r.created_at']],
        'search' => ['u.full_name', 's.service_name'], 'filter' => ['r.status', ['pending' => 'Chờ xử lý', 'processed' => 'Đã xử lý', 'failed' => 'Lỗi']],
    ],
];
