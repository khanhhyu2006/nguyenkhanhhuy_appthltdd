# BillTrack Web Admin

Bản demo dùng dữ liệu cứng cho 10 bảng BillTrack. Tìm dữ liệu tại [public/data/billtrack-demo.js](public/data/billtrack-demo.js). Bản demo lưu trạng thái hủy gói, nhắc hạn, nhóm chia hóa đơn và xác nhận đóng tiền trong trình duyệt.

## Xem bản demo

Dùng PHP 8.3 trở lên đã có trong PATH. Từ thư mục web-admin, chạy lệnh sau để mở Laravel.

```powershell
.\start-admin.cmd
```

Mở [http://127.0.0.1:8766](http://127.0.0.1:8766) và chọn **Tự điền tài khoản mẫu**, sau đó chọn **Đăng nhập**. Bạn cũng có thể mở tệp public/demo.html trực tiếp. Bản demo chạy bằng HTML, CSS và JavaScript, không cần MySQL hoặc API.

Tài khoản demo:

- Email: admin-demo@billtrack.local
- Mật khẩu: BillTrackDemo123!

## Khi kết nối lại MySQL

Đặt BILLTRACK_DEMO=false trong .env, cấu hình kết nối đến cơ sở dữ liệu BillTrack và chạy `.\start-admin.cmd` với PHP được máy cho phép. Dùng tài khoản quản trị trong MySQL để đăng nhập ở chế độ này. Các thay đổi của bản demo nằm trong trình duyệt và không được đồng bộ với MySQL.
