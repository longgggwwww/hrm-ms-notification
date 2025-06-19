# Zalo Integration - Group Message Feature (GMF)

## Overview

This service integrates with Zalo Official Account API to send text messages to groups using both:

- **Customer Support (CS) API**: For sending messages to individual users
- **Group Message Feature (GMF) API**: For sending messages to group conversations

## API Endpoints

### Group Message Feature (GMF)

Based on the official documentation: https://developers.zalo.me/docs/official-account/nhom-chat-gmf/tin-nhan/text_message

**Endpoint**: `/v3.0/oa/message`

**Request Structure**:

```json
{
  "recipient": {
    "conversation_id": "group_conversation_id"
  },
  "message": {
    "text": "Your message text here"
  }
}
```

**Headers**:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Customer Support (CS) API

**Endpoint**: `/v3.0/oa/message/cs`

**Request Structure**:

```json
{
  "recipient": {
    "user_id": "user_or_group_id"
  },
  "message": {
    "text": "Your message text here"
  }
}
```

## Configuration

### Environment Variables

```bash
# Zalo Official Account Configuration
ZALO_APP_ID=your_app_id
ZALO_APP_SECRET=your_app_secret
ZALO_CALLBACK_URL=http://localhost:3000/auth/zalo/callback
ZALO_GROUP_ID=your_group_conversation_id
ZALO_API_URL=https://openapi.zalo.me
```

### Config Structure

```typescript
zalo: {
  appId: process.env.ZALO_APP_ID || '',
  appSecret: process.env.ZALO_APP_SECRET || '',
  callbackUrl: process.env.ZALO_CALLBACK_URL || 'http://localhost:3000/auth/zalo/callback',
  groupId: process.env.ZALO_GROUP_ID || '', // For GMF, this should be conversation_id
  apiUrl: process.env.ZALO_API_URL || 'https://openapi.zalo.me',
}
```

## Authentication Flow

### 1. Initiate Authentication

```http
GET /auth/zalo
```

This will redirect to Zalo's OAuth page.

### 2. Handle Callback

```http
GET /auth/zalo/callback?code=AUTH_CODE&state=STATE
```

Automatically processes the authorization code and obtains access tokens.

### 3. Check Authentication Status

```http
GET /auth/zalo/status
```

Returns current authentication status and token information.

## Available Methods

### ZaloService Methods

#### `sendGroupMessage(message: string)`

- Uses Customer Support API (`/v3.0/oa/message/cs`)
- Recipient: `user_id`
- For individual users or CS scenarios

#### `sendGroupTextMessage(message: string)` ⭐ **New GMF Method**

- Uses Group Message Feature API (`/v3.0/oa/message`)
- Recipient: `conversation_id`
- For group conversations

#### `sendRichGroupMessage(title: string, subtitle: string, elements?: any[])`

- Sends rich formatted messages
- Uses Customer Support API with template structure

## Testing Endpoints

### Test CS API

```http
GET /auth/zalo/test-message?message=Hello from CS API
```

### Test GMF API ⭐ **New**

```http
GET /auth/zalo/test-gmf-message?message=Hello from GMF API
```

## Usage Examples

### Basic Text Message (GMF)

```typescript
await zaloService.sendGroupTextMessage('Hello Group! 👋');
```

### Rich Task Notification

```typescript
const message = `🆕 **Task mới được tạo**

📋 **Mã task:** #123
📝 **Tên task:** Implement user authentication
🏢 **Dự án:** HR Management Platform
👤 **Người tạo:** User 100
👥 **Được giao cho:** User 101, User 102
⏰ **Thời gian:** ${new Date().toLocaleString('vi-VN')}
🔗 **Task ID:** #123`;

await zaloService.sendGroupTextMessage(message);
```

## Error Handling

The service includes automatic retry mechanism for token-related errors:

- **Error Code 216**: Invalid token
- **Error Code 217**: Expired token
- **Error Code 218**: Revoked token
- **Error Code 219**: Access denied
- **Error Code 220**: App not approved

When these errors occur, the service automatically:

1. Attempts to refresh the access token
2. Retries the original API call
3. If refresh fails, throws authentication error

## Token Management

### Manual Token Refresh

```http
GET /auth/zalo/refresh-token
# or
POST /auth/zalo/refresh-token
```

### Auto Refresh

The service automatically refreshes tokens when API calls fail with token-related errors.

## Integration with Notification Service

The notification service automatically uses GMF for task notifications:

```typescript
// In notification.service.ts
private async sendZaloTaskNotification(payload: TaskEventPayload): Promise<void> {
  // ... build message ...
  await this.zaloService.sendGroupTextMessage(message); // Uses GMF API
}
```

## Differences Between CS and GMF APIs

| Feature     | Customer Support (CS)              | Group Message Feature (GMF) |
| ----------- | ---------------------------------- | --------------------------- |
| Endpoint    | `/v3.0/oa/message/cs`              | `/v3.0/oa/message`          |
| Recipient   | `user_id`                          | `conversation_id`           |
| Use Case    | Individual users, customer support | Group conversations         |
| Rate Limits | Standard CS limits                 | Group messaging limits      |

## Troubleshooting

### Common Issues

1. **Invalid conversation_id**: Ensure `ZALO_GROUP_ID` is set to the correct group conversation ID for GMF
2. **Authentication failed**: Check if tokens are valid and not expired
3. **API error 404**: Verify the endpoint URL and API version
4. **Rate limiting**: Implement proper delay between messages

### Debug Logs

Enable debug logging to see detailed API calls:

```bash
LOG_LEVEL=debug npm run start:dev
```

### Health Check

```http
GET /notifications/health
```

Returns service health including Zalo authentication status.

## Development

### Running Tests

```bash
# Test CS API
curl "http://localhost:3000/auth/zalo/test-message?message=Test CS"

# Test GMF API
curl "http://localhost:3000/auth/zalo/test-gmf-message?message=Test GMF"
```

### Integration Testing

The service automatically integrates with the task event system. When tasks are created/updated, notifications are sent via GMF API.

## Production Considerations

1. **Rate Limiting**: Implement proper rate limiting for group messages
2. **Error Monitoring**: Monitor API error rates and response times
3. **Token Storage**: Consider persistent token storage for production
4. **Backup Methods**: Have fallback notification methods if Zalo is unavailable
5. **Message Formatting**: Ensure messages comply with Zalo's content policies

## Resources

- [Zalo GMF Text Message Documentation](https://developers.zalo.me/docs/official-account/nhom-chat-gmf/tin-nhan/text_message)
- [Zalo Official Account API](https://developers.zalo.me/docs/official-account)
- [OAuth 2.0 Flow](https://developers.zalo.me/docs/official-account/xac-thuc-va-uy-quyen/xac-thuc-nguoi-dung)
