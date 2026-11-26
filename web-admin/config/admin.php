<?php

$slug = ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'];

return [
    'templates' => [
        'title' => 'Mẫu dịch vụ', 'table' => 'service_templates',
        'columns' => ['name' => 'Dịch vụ', 'slug' => 'Đường dẫn', 'category_id' => 'Danh mục', 'is_active' => 'Trạng thái'],
        'fields' => ['name' => ['Tên dịch vụ', 'text'], 'slug' => ['Đường dẫn', 'text'], 'category_id' => ['Danh mục', 'category'], 'is_active' => ['Trạng thái', 'status', 1], 'logo_url' => ['URL logo', 'url'], 'official_cancel_url' => ['URL hủy gói', 'url'], 'cancel_instructions' => ['Hướng dẫn hủy', 'textarea'], 'plans_json' => ['Các gói cước', 'plans']],
        'rules' => ['name' => 'required|string|max:150', 'slug' => $slug, 'category_id' => 'required|integer|exists:categories,id', 'is_active' => 'required|boolean', 'logo_url' => 'nullable|url:http,https|max:500', 'official_cancel_url' => 'nullable|url:http,https|max:500', 'cancel_instructions' => 'nullable|string|max:5000', 'plans_json' => 'nullable|json|max:10000'],
    ],
    'categories' => [
        'title' => 'Danh mục', 'table' => 'categories',
        'columns' => ['name' => 'Danh mục', 'slug' => 'Đường dẫn', 'color_hex' => 'Màu', 'sort_order' => 'Thứ tự'],
        'fields' => ['name' => ['Tên danh mục', 'text'], 'slug' => ['Đường dẫn', 'text'], 'icon' => ['Biểu tượng', 'text', 'layers'], 'color_hex' => ['Mã màu', 'color', '#8b2e2e'], 'sort_order' => ['Thứ tự', 'number', 0]],
        'rules' => ['name' => 'required|string|max:100', 'slug' => $slug, 'icon' => 'required|string|max:100', 'color_hex' => ['required', 'regex:/^#[0-9a-f]{6}$/i'], 'sort_order' => 'required|integer|min:0|max:2147483647'],
    ],
    'rates' => [
        'title' => 'Tỷ giá', 'table' => 'exchange_rates',
        'columns' => ['currency_code' => 'Ngoại tệ', 'rate_to_vnd' => 'Tỷ giá sang VND', 'source_bank' => 'Nguồn', 'fetched_at' => 'Cập nhật'],
        'fields' => ['currency_code' => ['Mã ngoại tệ', 'text'], 'rate_to_vnd' => ['Tỷ giá sang VND', 'decimal'], 'source_bank' => ['Nguồn', 'text'], 'fetched_at' => ['Ngày cập nhật', 'datetime-local']],
        'rules' => ['currency_code' => ['required', 'regex:/^[A-Z]{3}$/'], 'rate_to_vnd' => 'required|numeric|gt:0|decimal:0,4|max:99999999999', 'source_bank' => 'required|string|max:100', 'fetched_at' => 'required|date_format:Y-m-d\TH:i'],
    ],
];
