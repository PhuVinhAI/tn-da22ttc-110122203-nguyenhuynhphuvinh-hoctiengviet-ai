# Hướng dẫn cấu hình Gmail cho Mailer

## Bước 1: Bật 2-Step Verification

1. Truy cập [Google Account Security](https://myaccount.google.com/security)
2. Tìm mục "2-Step Verification"
3. Nhấn "Get Started" và làm theo hướng dẫn
4. Xác thực bằng số điện thoại hoặc app Authenticator

## Bước 2: Tạo App Password

1. Sau khi bật 2-Step Verification, truy cập [App Passwords](https://myaccount.google.com/apppasswords)
2. Chọn "Select app" → "Mail"
3. Chọn "Select device" → "Other (Custom name)"
4. Nhập tên: "Language Learning App" hoặc tên bạn muốn
5. Nhấn "Generate"
6. Google sẽ hiển thị mật khẩu 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)
7. **LƯU Ý**: Copy mật khẩu này ngay, bạn sẽ không thể xem lại!

## Bước 3: Cấu hình .env

Mở file `backend/.env` và cập nhật:

```env
# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop  # App Password (bỏ dấu cách)
MAIL_FROM_NAME=Language Learning App
MAIL_FROM_ADDRESS=your-email@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

**Quan trọng**: 
- Sử dụng App Password, KHÔNG phải password Gmail thật
- Bỏ hết dấu cách trong App Password (16 ký tự liền nhau)
- `MAIL_USER` và `MAIL_FROM_ADDRESS` thường giống nhau

## Bước 4: Test Email

Sau khi cấu hình xong, test bằng cách:

1. Đăng ký tài khoản mới → Kiểm tra email verification
2. Dùng "Forgot Password" → Kiểm tra email reset password

## Troubleshooting

### Lỗi: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Nguyên nhân**: Chưa bật 2-Step Verification hoặc dùng password thật thay vì App Password

**Giải pháp**:
1. Bật 2-Step Verification
2. Tạo App Password mới
3. Dùng App Password trong .env

### Lỗi: "Connection timeout"

**Nguyên nhân**: Port bị chặn hoặc firewall

**Giải pháp**:
1. Kiểm tra firewall cho phép port 587
2. Thử đổi `MAIL_PORT=465` và `MAIL_SECURE=true`

### Lỗi: "Self signed certificate"

**Nguyên nhân**: SSL certificate issue

**Giải pháp**: Thêm vào mail.config.ts:

```typescript
transport: {
  // ... existing config
  tls: {
    rejectUnauthorized: false
  }
}
```

### Email không gửi được nhưng không báo lỗi

**Nguyên nhân**: Gmail block "Less secure apps"

**Giải pháp**:
1. Đảm bảo đã dùng App Password
2. Kiểm tra [Recent security activity](https://myaccount.google.com/notifications)
3. Nếu có cảnh báo, cho phép access

## Giới hạn Gmail

- **Giới hạn gửi**: 500 emails/ngày (Gmail free)
- **Rate limit**: ~100 emails/giờ
- **Khuyến nghị**: Dùng SendGrid/AWS SES cho production

## Alternative: SendGrid

Nếu muốn dùng SendGrid thay vì Gmail:

```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

## Security Best Practices

1. ✅ **KHÔNG** commit file `.env` vào git
2. ✅ Dùng App Password, không dùng password thật
3. ✅ Rotate App Password định kỳ (3-6 tháng)
4. ✅ Xóa App Password không dùng nữa
5. ✅ Dùng email riêng cho app, không dùng email cá nhân chính
