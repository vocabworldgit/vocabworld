# Subscription System Testing Guide

## Overview
This guide provides step-by-step testing procedures for the VocabWorld subscription system to ensure reliable payment/access synchronization.

## Prerequisites
1. Database schema applied (`database-schema-subscription.sql`)
2. Stripe configuration complete (see `STRIPE_SETUP.md`)
3. App running locally or deployed
4. Test environment configured

## Manual Testing Procedures

### 1. Access Control Testing

#### Test 1.1: Unauthenticated User Access
- **Expected**: Only greetings topic (topic 1) accessible
- **Steps**:
  1. Open app without signing in
  2. Try to access different vocabulary topics
  3. Verify only greetings is accessible
  4. Verify other topics show paywall

#### Test 1.2: Free User Access
- **Expected**: Same as unauthenticated, only greetings accessible
- **Steps**:
  1. Sign in with new account
  2. Verify free subscription status in auth context
  3. Try accessing different topics
  4. Verify only greetings works, others show paywall

#### Test 1.3: Premium User Access
- **Expected**: All topics accessible
- **Steps**:
  1. Complete subscription purchase (use test card 4242424242424242)
  2. Verify subscription status updates to active
  3. Test access to all vocabulary topics
  4. Verify no paywall appears

### 2. Payment Flow Testing

#### Test 2.1: Successful Subscription Purchase
- **Expected**: Seamless payment → immediate access
- **Steps**:
  1. Click on restricted topic as free user
  2. Paywall modal appears
  3. Click "Start Yearly Plan" 
  4. Complete Stripe checkout with test card 4242424242424242
  5. Redirect to success page
  6. Return to app - verify premium access unlocked

#### Test 2.2: Failed Payment
- **Expected**: Payment fails gracefully, user remains free
- **Steps**:
  1. Trigger paywall modal
  2. Use declining test card 4000000000000002
  3. Verify payment fails
  4. Return to app - verify user still free tier
  5. Verify topics remain locked

#### Test 2.3: Cancelled Checkout
- **Expected**: User returns to app unchanged
- **Steps**:
  1. Start subscription flow
  2. Cancel during Stripe checkout
  3. Redirect to cancelled page
  4. Return to app - verify free status maintained

### 3. Webhook Testing

#### Test 3.1: Subscription Activation
- **Expected**: Webhook updates database correctly
- **Steps**:
  1. Monitor Stripe webhook logs
  2. Complete test subscription
  3. Verify `customer.subscription.created` webhook received
  4. Check database - subscription record created
  5. Verify access immediately granted

#### Test 3.2: Payment Success
- **Expected**: Payment events logged correctly
- **Steps**:
  1. Monitor `invoice.payment_succeeded` events
  2. Check database subscription_events table
  3. Verify payment logged with correct amount

#### Test 3.3: Payment Failure
- **Expected**: Failed payments handled gracefully
- **Steps**:
  1. Simulate payment failure (Stripe test mode)
  2. Verify `invoice.payment_failed` webhook
  3. Check access remains available during grace period
  4. Verify event logged in database

### 4. Subscription Lifecycle Testing

#### Test 4.1: Subscription Renewal
- **Expected**: Automatic renewal extends access
- **Steps**:
  1. Create subscription with very short period (test mode)
  2. Wait for renewal attempt
  3. Verify access continues uninterrupted
  4. Check database for updated period_end

#### Test 4.2: Subscription Cancellation
- **Expected**: Access revoked at period end
- **Steps**:
  1. Cancel active subscription
  2. Verify `customer.subscription.deleted` webhook
  3. Check access remains until period_end
  4. After period_end, verify access reverted to free

#### Test 4.3: Subscription Expiry
- **Expected**: Expired subscriptions lose premium access
- **Steps**:
  1. Set subscription with past period_end date
  2. Verify checkUserPremiumAccess returns false
  3. Test topic access - should only allow greetings
  4. Verify paywall appears for restricted topics

## Automated Testing

### JavaScript Test Suite
Run the automated test script:

```bash
# In browser console
testSubscriptionFlows()
```

This tests:
- ✅ Unauthenticated access control
- ✅ Free user restrictions  
- ✅ Premium user permissions
- ✅ Expired subscription handling

### API Testing Endpoints
Use the test API endpoints:

```javascript
// Test topic access
POST /api/test/topic-access
{
  "topicId": 2,
  "userId": "user-id-or-null"
}

// Create test user
POST /api/test/create-user  
{
  "userId": "test-user-123",
  "subscriptionStatus": "active",
  "planType": "yearly"
}

// Cleanup test data
POST /api/test/cleanup
{
  "userIds": ["test-user-123"]
}
```

## Key Verification Points

### ✅ Payment/Access Synchronization
- Payment success immediately grants access
- Payment failure preserves free tier access
- Subscription cancellation respects period end
- Expired subscriptions revert to free tier

### ✅ Security
- Access control enforced at API level
- Database functions prevent unauthorized access
- Webhook signatures verified
- RLS policies protect user data

### ✅ User Experience
- Smooth payment flow without glitches
- Clear messaging during payment process
- Immediate access after successful payment
- Graceful handling of payment failures

## Debugging

### Database Queries
```sql
-- Check user subscription
SELECT * FROM user_subscriptions WHERE user_id = 'user-id';

-- Check subscription events
SELECT * FROM subscription_events WHERE user_id = 'user-id' ORDER BY created_at DESC;

-- Check access logs
SELECT * FROM user_access_log WHERE user_id = 'user-id' ORDER BY accessed_at DESC;
```

### Log Monitoring
- Monitor Stripe webhook events in dashboard
- Check application logs for subscription events
- Verify database triggers and functions work correctly

## Production Checklist

- [ ] All test scenarios pass
- [ ] Webhook endpoints configured in production
- [ ] Live Stripe keys configured
- [ ] Database schema applied to production
- [ ] Rate limiting configured on payment endpoints
- [ ] Monitoring and alerting set up for failed payments
- [ ] Customer support procedures documented