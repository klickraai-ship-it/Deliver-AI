# Payment Integration - Production Requirements

## Critical Issues to Address Before Production Launch

### 1. Razorpay Integration
**Current State:** Mock implementation that doesn't call real Razorpay API

**Required Changes:**
```bash
# Install Razorpay SDK
npm install razorpay
```

```typescript
// server/paymentService.ts - RazorpayProvider.createOrder()
import Razorpay from 'razorpay';

async createOrder(amount: number, currency: string, userId?: string): Promise<any> {
  const razorpay = new Razorpay({
    key_id: this.config.keyId,
    key_secret: this.config.keySecret,
  });

  const order = await razorpay.orders.create({
    amount: amount * 100, // Amount in paise
    currency: currency.toUpperCase(),
    receipt: `receipt_${Date.now()}`,
    payment_capture: 1,
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    clientData: {
      keyId: this.config.keyId,
      // Never expose keySecret
    },
  };
}
```

### 2. PayPal Integration
**Current State:** Incomplete implementation without proper capture logic

**Required Changes:**
```bash
# Install PayPal SDK
npm install @paypal/checkout-server-sdk
```

Complete the PayPal capture flow and client-side integration.

### 3. Transaction Persistence
**Current Issues:**
- Transactions not properly linked to users after payment
- No reconciliation between orders and completed payments

**Fix Required:**
- Update `PaymentService.createOrder()` to persist transactions correctly
- Ensure `POST /api/payment/verify` links transactions to users
- Add transaction status updates in webhook handlers

### 4. Security Hardening

**Critical Security Fixes:**
```typescript
// Add HTTPS enforcement middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.status(403).json({ message: 'HTTPS required' });
  }
  next();
});
```

**Webhook Signature Verification:**
- Implement full PayPal webhook signature verification using certificates
- Add timestamp validation to prevent replay attacks
- Store webhook event IDs to prevent duplicate processing

### 5. Environment Configuration

**Required Environment Variables:**
```env
# Production only
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_WEBHOOK_ID=xxxxx
PAYPAL_MODE=production

# Security
ENCRYPTION_KEY=xxxxx  # For credential encryption
TRACKING_SECRET=xxxxx  # For token validation
```

### 6. Testing Checklist

Before production launch:
- [ ] Test complete Razorpay payment flow (sandbox → production)
- [ ] Test complete PayPal payment flow (sandbox → production)
- [ ] Test webhook delivery and signature verification
- [ ] Test idempotency (duplicate webhook handling)
- [ ] Test payment failure scenarios
- [ ] Test demo-to-paid upgrade flow
- [ ] Verify HTTPS enforcement
- [ ] Penetration testing on payment endpoints
- [ ] Load testing with concurrent payments

### 7. Monitoring & Alerts

**Required Monitoring:**
- Payment success/failure rates
- Webhook delivery failures
- Signature verification failures
- Transaction state mismatches
- Demo mode expirations

**Alert Triggers:**
- Payment verification failure rate > 5%
- Webhook signature mismatch
- Orphaned transactions (no user after 1 hour)
- API rate limit approaching

## Current Demo Mode Implementation

**Status:** ✅ Functional

The demo mode is currently working:
- Creates users with `paymentStatus='demo'`
- Sets `demoStartedAt` timestamp
- Expires after 10 minutes (enforced in middleware)

This allows users to test the platform without payment while the full payment integration is completed.

## Recommended Approach

1. **Phase 1 (Current):** Demo mode only, paid signup shows "Coming Soon"
2. **Phase 2:** Complete Razorpay integration with real SDK
3. **Phase 3:** Complete PayPal integration
4. **Phase 4:** Production security hardening
5. **Phase 5:** Monitoring and alerting setup
6. **Phase 6:** Load testing and launch

## Estimated Time to Production

- Razorpay SDK integration: 4-6 hours
- PayPal SDK integration: 4-6 hours
- Transaction persistence fixes: 2-3 hours
- Security hardening: 3-4 hours
- Testing: 4-6 hours
- **Total: ~20-30 hours**

## Notes

The current architecture (PaymentService facade, provider adapters) is sound. The main work is replacing mock implementations with real SDK calls and ensuring proper transaction lifecycle management.
