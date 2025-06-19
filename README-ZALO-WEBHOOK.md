# Zalo GMF Webhook Setup Guide

## Tổng quan

Service này đã được thiết lập để nhận và xử lý webhook events từ Zalo Official Account với Group Message Feature (GMF).

## Endpoints

### 1. Webhook Verification

- **URL**: `GET /webhook/zalo/verify`
- **Mục đích**: Để Zalo verify webhook URL khi setup
- **Parameters**:
  - `verifyToken`: Token để verify
  - `challenge`: Challenge string từ Zalo

### 2. Message Webhook

- **URL**: `POST /webhook/zalo/message`
- **Mục đích**: Nhận events tin nhắn từ Zalo GMF
- **Headers**:
  - `x-zalo-signature`: Signature để verify (optional)

### 3. Test Webhook

- **URL**: `POST /webhook/zalo/test`
- **Mục đích**: Test webhook locally
- **Body**: `{ "text": "Test message" }`

### 4. Health Check

- **URL**: `GET /webhook/zalo/health`
- **Mục đích**: Kiểm tra trạng thái webhook service

## Cấu hình Environment Variables

Thêm các biến môi trường sau vào file `.env`:

```bash
# Zalo App Configuration
ZALO_APP_ID=your_app_id
ZALO_APP_SECRET=your_app_secret
ZALO_GROUP_ID=your_group_id

# Webhook Configuration
ZALO_VERIFY_TOKEN=your_verify_token
ZALO_WEBHOOK_VERIFY_SIGNATURE=true

# Optional
ZALO_API_URL=https://openapi.zalo.me
```

## Setup trong Zalo Developer Console

1. **Đăng nhập Zalo Developer Console**

   - Truy cập: https://developers.zalo.me
   - Đăng nhập với tài khoản Zalo

2. **Tạo/Chọn Zalo Official Account**

   - Vào phần "Official Account"
   - Chọn app đã tạo hoặc tạo mới

3. **Cấu hình Webhook**

   - Vào tab "Webhook"
   - Thêm Webhook URL: `https://your-domain.com/webhook/zalo/verify`
   - Verify Token: sử dụng giá trị của `ZALO_VERIFY_TOKEN`
   - Chọn events muốn nhận: "Messages"

4. **Test Webhook**
   - Sau khi setup thành công, test bằng cách gửi tin nhắn vào group
   - Kiểm tra logs của service

## Cấu trúc Message Event

Webhook sẽ nhận được payload theo format:

```json
{
  "app_id": "your_app_id",
  "timestamp": "1640995200000",
  "data": [
    {
      "app_id": "your_app_id",
      "user_id_by_app": "user123",
      "oa_id": "oa_id",
      "timestamp": "1640995200000",
      "event_name": "user_send_text",
      "message": {
        "text": "Hello from group",
        "msg_id": "msg_123",
        "attachments": []
      },
      "sender": {
        "id": "sender_id"
      },
      "recipient": {
        "id": "oa_id"
      },
      "group_info": {
        "group_id": "group_123",
        "group_name": "Team Chat",
        "group_type": "GMF"
      }
    }
  ]
}
```

## Các loại tin nhắn được hỗ trợ

1. **Text Messages**: Tin nhắn văn bản thường
2. **Image Attachments**: Hình ảnh
3. **File Attachments**: File đính kèm
4. **Location**: Vị trí địa lý

## Logging và Monitoring

Service sẽ log các thông tin sau:

- Webhook events received
- Message processing status
- Errors và exceptions
- Auto-reply triggers

## Security

- Signature verification (optional)
- Verify token validation
- Environment variable protection

## Development

### Local Testing

```bash
# Test webhook locally
curl -X POST http://localhost:3000/webhook/zalo/test \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message from curl"}'

# Check health
curl http://localhost:3000/webhook/zalo/health
```

### Using ngrok for webhook testing

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the https URL for webhook configuration
# Example: https://abc123.ngrok.io/webhook/zalo/verify
```

## Troubleshooting

### Common Issues

1. **Webhook verification fails**

   - Kiểm tra `ZALO_VERIFY_TOKEN` đúng không
   - Đảm bảo endpoint `/webhook/zalo/verify` accessible

2. **Messages không nhận được**

   - Kiểm tra webhook URL đã được verify chưa
   - Xem logs service có báo lỗi không
   - Kiểm tra group ID configuration

3. **Signature verification fails**
   - Set `ZALO_WEBHOOK_VERIFY_SIGNATURE=false` để tắt verification tạm thời
   - Kiểm tra implementation của signature verification

### Debug Commands

```bash
# Check service logs
docker-compose logs -f notification

# Check configuration
curl http://localhost:3000/webhook/zalo/health
```

## Next Steps

Sau khi setup thành công, có thể mở rộng:

1. **Auto Reply**: Tự động phản hồi tin nhắn
2. **Message Forwarding**: Chuyển tiếp tin nhắn đến các channels khác
3. **Integration**: Tích hợp với notification system
4. **Analytics**: Phân tích tin nhắn và tương tác
