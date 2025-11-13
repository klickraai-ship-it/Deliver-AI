# Email Features Documentation

## Overview
This newsletter system includes complete email tracking, unsubscribe functionality, public subscription forms, and web version viewing with HMAC-signed security tokens for multi-tenant isolation.

## Features Implemented

### 1. Unsubscribe Functionality ✅

**Endpoint**: `GET /api/public/unsubscribe/:token`

**Security**:
- HMAC-SHA256 signed tokens with 1-year expiry
- Token format: `subscriberId:userId:expiresAt:signature`
- Requires userId for multi-tenant isolation (rejects legacy tokens)
- Validates signature before processing

**Usage**:
```html
<!-- In email templates -->
<a href="{{unsubscribe_url}}">Unsubscribe</a>
```

**Token Generation**:
```typescript
const token = trackingService.generateUnsubscribeToken(subscriberId, userId);
const url = `${domain}/api/public/unsubscribe/${token}`;
```

**Multi-Tenant Security**:
- Token must include userId
- Database query filters by BOTH subscriberId AND userId
- Cross-tenant unsubscribe attempts return 404

---

### 2. Web Version Viewing ✅

**Endpoint**: `GET /api/public/view/:token`

**Security**:
- HMAC-SHA256 signed tokens with 1-year expiry
- Token format: `campaignId:subscriberId:userId:expiresAt:signature`
- Validates signature and expiry before processing
- All database queries filter by userId from token

**Usage**:
```html
<!-- In email templates -->
<a href="{{web_version_url}}">View in browser</a>
```

**Token Generation**:
```typescript
const token = trackingService.generateWebVersionToken(campaignId, subscriberId, userId);
const url = `${domain}/api/public/view/${token}`;
```

**Features**:
- Renders full HTML email in browser
- Includes web version banner at top
- Replaces all merge tags with subscriber data
- Generates fresh unsubscribe link
- Enforces multi-tenant isolation

---

### 3. Public Subscribe Endpoint ✅

**Endpoint**: `POST /api/public/subscribe`

**Request Body**:
```json
{
  "userId": "tenant-user-id",
  "email": "subscriber@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "lists": ["newsletter"]
}
```

**Features**:
- Requires userId to assign subscriber to correct tenant
- Tracks GDPR consent with timestamp
- Resubscribes existing unsubscribed users
- Updates subscriber data if already exists
- Returns success message with subscriber object

**Security**:
- userId must be provided (typically embedded in subscription form)
- Email addresses are lowercase normalized
- Duplicate email prevention per tenant

---

### 4. Merge Tags System ✅

**Supported Merge Tags**:

| Tag | Description | Example |
|-----|-------------|---------|
| `{{first_name}}` | Subscriber's first name | John |
| `{{last_name}}` | Subscriber's last name | Doe |
| `{{email}}` | Subscriber's email | john@example.com |
| `{{campaign_name}}` | Campaign name | Weekly Newsletter |
| `{{unsubscribe_url}}` | HMAC-signed unsubscribe link | /api/public/unsubscribe/ABC... |
| `{{web_version_url}}` | HMAC-signed web version link | /api/public/view/XYZ... |

**Usage in Templates**:
```html
<html>
  <body>
    <p>Hi {{first_name}},</p>
    <p>Welcome to {{campaign_name}}!</p>
    
    <div style="text-align: center; margin-top: 20px;">
      <a href="{{web_version_url}}">View in browser</a> | 
      <a href="{{unsubscribe_url}}">Unsubscribe</a>
    </div>
  </body>
</html>
```

**Processing**:
1. `replaceMergeTags()` replaces subscriber-specific tags
2. `processEmailForTracking()` injects unsubscribe/web version URLs
3. Both happen automatically during campaign sends

---

## Security Architecture

### HMAC Token System

**Secret Management**:
- Uses `TRACKING_SECRET` environment variable
- Fallback to random dev secret with warning
- HMAC-SHA256 signature algorithm

**Token Lifecycle**:
1. **Generation**: Server creates token with data + HMAC signature
2. **Transmission**: Token sent in email or URL
3. **Validation**: Server verifies signature and expiry before use
4. **Rejection**: Invalid/expired tokens return 400 error

**Token Validation Flow**:
```typescript
// 1. Decode base64url token
const decoded = Buffer.from(token, 'base64url').toString('utf-8');
const parts = decoded.split(':');

// 2. Extract components
const [subscriberId, userId, expiresAt, signature] = parts;

// 3. Verify HMAC signature
const data = `${subscriberId}:${userId}:${expiresAt}`;
const hmac = crypto.createHmac('sha256', TRACKING_SECRET);
hmac.update(data);
const expectedSignature = hmac.digest('hex');

if (signature !== expectedSignature) {
  return null; // Invalid token
}

// 4. Check expiry
if (Date.now() > parseInt(expiresAt)) {
  return null; // Expired token
}

// 5. Return validated data
return { subscriberId, userId };
```

### Multi-Tenant Isolation

**Token-Level Isolation**:
- All public tokens include `userId`
- Tokens cannot be forged due to HMAC signatures
- Tokens cannot be reused across tenants

**Database-Level Isolation**:
- All queries filter by `userId` from validated token
- Composite WHERE clauses: `(subscriberId AND userId)`
- Cross-tenant access returns 404 or empty results

**Campaign Sending**:
- Campaign includes `userId` in context
- `processEmailForTracking()` receives `userId: campaign.userId`
- All generated tokens include correct tenant userId

---

## Implementation Details

### Email Tracking Service

**Class**: `EmailTrackingService`

**Key Methods**:
```typescript
class EmailTrackingService {
  // Inject tracking pixel
  generateTrackingPixel(options: EmailTrackingOptions): string
  
  // Wrap links with click tracking
  wrapLinksWithTracking(html: string, options: EmailTrackingOptions): { html: string; links: string[] }
  
  // Inject unsubscribe link (with HMAC token including userId)
  injectUnsubscribeLink(html: string, subscriberId: string, userId?: string): string
  
  // Process email for sending (tracking + unsubscribe + web version)
  processEmailForTracking(content: EmailContent, options: EmailTrackingOptions & { userId?: string }): EmailContent
  
  // Replace merge tags
  replaceMergeTags(content: string, subscriber: { firstName?: string; lastName?: string; email: string }): string
  
  // Generate HMAC-signed unsubscribe token
  private generateUnsubscribeToken(subscriberId: string, userId?: string): string
  
  // Generate HMAC-signed web version token
  private generateWebVersionToken(campaignId: string, subscriberId: string, userId: string): string
  
  // Validate and decode unsubscribe token
  static decodeUnsubscribeToken(token: string): { subscriberId: string; userId?: string } | null
  
  // Validate and decode web version token
  static decodeWebVersionToken(token: string): { campaignId: string; subscriberId: string; userId: string } | null
}
```

### Campaign Sending Flow

**Process**:
1. User triggers campaign send
2. System fetches target subscribers
3. For each subscriber:
   - Replace merge tags (firstName, lastName, email)
   - Call `processEmailForTracking()` with userId
     - Inject web version URL
     - Inject unsubscribe URL
     - Wrap links with tracking
     - Add tracking pixel
   - Send email via Resend
   - Update campaign_subscribers status

**Code Example**:
```typescript
const processedContent = trackingService.processEmailForTracking(emailContent, {
  campaignId: campaign.id,
  subscriberId: subscriber.id,
  trackingDomain: 'https://app.replit.dev',
  userId: campaign.userId, // CRITICAL for multi-tenant tokens
});
```

---

## Testing

### Unsubscribe Flow Test
```bash
# 1. Send test campaign
POST /api/campaigns/:id/send

# 2. Extract unsubscribe token from email HTML
# Token format: /api/public/unsubscribe/BASE64_TOKEN

# 3. Visit unsubscribe link
GET /api/public/unsubscribe/BASE64_TOKEN

# Expected: "Successfully Unsubscribed" page
# Database: subscriber.status = 'unsubscribed'
```

### Web Version Test
```bash
# 1. Send test campaign
POST /api/campaigns/:id/send

# 2. Extract web version token from email HTML  
# Token format: /api/public/view/BASE64_TOKEN

# 3. Visit web version link
GET /api/public/view/BASE64_TOKEN

# Expected: Full email HTML with banner
# All merge tags replaced
# Fresh unsubscribe link generated
```

### Multi-Tenant Security Test
```bash
# 1. User A sends campaign, gets unsubscribe token
# 2. User B attempts to decode token for their subscriber
# 3. Token validation succeeds (valid HMAC)
# 4. Database query filters by BOTH subscriberId AND userId
# 5. No rows match (userId mismatch)
# 6. Returns 404 - Cross-tenant access BLOCKED
```

---

## Google OAuth Credentials

**Status**: ✅ Securely stored in Replit Secrets

**Environment Variables**:
- `GOOGLE_CLIENT_ID`: OAuth 2.0 client ID
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 client secret

**Usage**:
```typescript
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
```

---

## Production Checklist

### Security
- [x] HMAC-signed tokens for unsubscribe
- [x] HMAC-signed tokens for web version
- [x] userId included in all tokens for multi-tenant isolation
- [x] Token expiry validation (1 year)
- [x] Signature validation before processing
- [x] Multi-tenant database query filtering
- [x] Legacy token rejection (no userId)

### Functionality
- [x] Unsubscribe endpoint working
- [x] Web version viewing working
- [x] Public subscribe endpoint working
- [x] All merge tags supported
- [x] Campaign sending passes userId
- [x] Email processing injects URLs correctly

### Monitoring
- [ ] Add rate limiting to public endpoints
- [ ] Monitor token validation failures
- [ ] Track unsubscribe rates
- [ ] Monitor web version views
- [ ] Log suspicious cross-tenant access attempts

### Future Enhancements
- [ ] Add WYSIWYG email editor (TipTap)
- [ ] Add one-click resubscribe option
- [ ] Add unsubscribe preferences (partial unsubscribe)
- [ ] Add A/B testing for unsubscribe pages
- [ ] Add analytics for web version views
- [ ] Implement double opt-in for subscriptions

---

## Troubleshooting

### "Invalid Unsubscribe Link" Error
- **Cause**: Token invalid, expired, or missing userId
- **Solution**: Ensure campaign was sent with userId in tracking options

### Web Version Not Rendering
- **Cause**: Token invalid or campaign/template deleted
- **Solution**: Check token signature and verify campaign exists

### Cross-Tenant Unsubscribe
- **Cause**: Token doesn't include userId (legacy token)
- **Solution**: Regenerate tokens with userId included

### Merge Tags Not Replaced
- **Cause**: processEmailForTracking not called with userId
- **Solution**: Verify userId passed to tracking service

---

## API Reference

### Public Endpoints

#### POST /api/public/subscribe
Subscribe new email to mailing list

**Request**:
```json
{
  "userId": "string (required)",
  "email": "string (required)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "lists": ["string"] (optional)
}
```

**Response**:
```json
{
  "message": "Successfully subscribed",
  "subscriber": { /* Subscriber object */ }
}
```

#### GET /api/public/unsubscribe/:token
Unsubscribe user via HMAC-signed token

**Response**: HTML page confirming unsubscription

#### GET /api/public/view/:token
View email in browser via HMAC-signed token

**Response**: HTML email content with banner

---

## Notes

- All new unsubscribe/web version tokens include userId
- Legacy tokens without userId are rejected
- Token expiry is 1 year from generation
- TRACKING_SECRET should be set in production
- All database queries enforce multi-tenant isolation
