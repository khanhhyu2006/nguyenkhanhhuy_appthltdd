# BillTrack

Đồ án theo dõi gói đăng ký và hóa đơn định kỳ.

| Thư mục | Nội dung |
| --- | --- |
| [Ứng dụng Expo](nguyenkhanhhuy-appthltdd/) | Quản lý gói, lịch gia hạn, ngân sách, lịch sử thanh toán và chia hóa đơn. |
| [Web Admin Laravel](web-admin/README.md) | Quản lý mẫu dịch vụ, tài khoản, nhắc hạn, hỗ trợ và kiểm định dữ liệu hóa đơn. |

## Chạy ứng dụng Expo

Từ thư mục nguyenkhanhhuy-appthltdd, chạy npm ci rồi npm run web để mở trên trình duyệt.

## Chạy Web Admin

Cài PHP 8.3 trở lên và Composer. Từ thư mục web-admin, chạy composer install, sao chép .env.example thành .env, chạy php artisan key:generate và chạy start-admin.cmd trên Windows.

Mở [Web Admin cục bộ](http://127.0.0.1:8766/) rồi chọn **Tự điền tài khoản mẫu**. Laravel phục vụ giao diện demo và dữ liệu mẫu. Demo không cần MySQL và chưa đồng bộ dữ liệu giữa ứng dụng Expo và trang Admin.
