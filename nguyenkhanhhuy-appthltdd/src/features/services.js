const brands = {
  Netflix: { mark: 'N', tint: '#B61724', official_cancel_url: 'https://www.netflix.com/cancelplan', instructions: ['Đăng nhập tài khoản Netflix đang thanh toán.', 'Chọn Hủy tư cách thành viên và xác nhận.'], plans: [['Cơ bản', 108000], ['Cao cấp', 260000]] },
  'YouTube Premium': { mark: '▶', tint: '#B8272B', official_cancel_url: 'https://www.youtube.com/paid_memberships', instructions: ['Mở Quản lý gói thành viên.', 'Chọn Hủy kích hoạt rồi xác nhận hủy.'], plans: [['Cá nhân', 79000], ['Sinh viên', 49000]] },
  'ChatGPT Plus': { mark: 'AI', tint: '#305D52', official_cancel_url: 'https://chatgpt.com/#settings/Account', instructions: ['Vào Cài đặt → Tài khoản → Quản lý.', 'Chọn Cancel subscription. Nếu mua qua App Store hoặc Google Play, hủy tại cửa hàng đã thanh toán.'] },
  Spotify: { mark: 'S', tint: '#17663D', official_cancel_url: 'https://www.spotify.com/account/overview/', instructions: ['Mở Quản lý gói của bạn trong tài khoản.', 'Chọn Hủy đăng ký và xác nhận.'], plans: [['Gia đình', 99000], ['Sinh viên', 29900]] },
  'iCloud+': { mark: '☁', tint: '#246598', official_cancel_url: 'https://support.apple.com/en-us/108318', instructions: ['Mở Cài đặt của thiết bị Apple và chọn tài khoản.', 'Chọn iCloud+ rồi hạ cấp hoặc hủy gói.'], plans: [['50 GB', 19000], ['2 TB', 249000]] },
  'Apple Music': { mark: '♪', tint: '#A73056', official_cancel_url: 'https://account.apple.com/', instructions: ['Mở phần Đăng ký trên thiết bị Apple.', 'Chọn Apple Music và xác nhận Hủy đăng ký.'] },
  'Google One': { mark: 'G', tint: '#315E8C', official_cancel_url: 'https://one.google.com/settings', instructions: ['Mở Cài đặt Google One bằng tài khoản đang thanh toán.', 'Chọn Hủy gói thành viên rồi xác nhận.'] },
  Adobe: { mark: 'A', tint: '#A73B2E', official_cancel_url: 'https://account.adobe.com/plans', instructions: ['Chọn Manage plan của gói muốn hủy.', 'Xem điều khoản và chọn Cancel your plan.'] },
};

export function getBrand(name) {
  const normalized = name.trim().toLowerCase();
  return Object.entries(brands).find(([key]) => key.toLowerCase() === normalized)?.[1];
}

export function servicePlans(template) {
  const extra = getBrand(template.name)?.plans ?? [];
  return [template, ...extra.map(([plan, amount]) => ({ ...template, plan, amount }))];
}
