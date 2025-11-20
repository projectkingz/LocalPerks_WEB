# Partner Subscription System Setup

This document outlines the complete partner subscription system implementation for LocalPerks.

## 🏗️ System Overview

The subscription system includes:
- **Tiered Pricing**: Basic (£19), Plus (£20), Premium (£21), Elite (£22)
- **28-Day Billing Cycle**: Partners are billed every 28 days from registration
- **Stripe Integration**: Secure payment processing and subscription management
- **Webhook Handling**: Automated subscription status updates
- **Admin Management**: Configurable tiers and pricing

## 📊 Database Schema

### New Models Added:
- `SubscriptionTier` - Configurable subscription tiers
- `Subscription` - Active subscriptions per tenant
- `SubscriptionPayment` - Payment history and tracking

### Updated Models:
- `Tenant` - Added subscription fields (tier, status, billing date, Stripe customer ID)

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Custom Product IDs (will be auto-generated if not provided)
STRIPE_BASIC_PRODUCT_ID=prod_basic
STRIPE_PLUS_PRODUCT_ID=prod_plus
STRIPE_PREMIUM_PRODUCT_ID=prod_premium
STRIPE_ELITE_PRODUCT_ID=prod_elite
```

### 2. Database Migration

The database schema has been updated. Run:

```bash
npx prisma db push
npx prisma generate
```

### 3. Setup Subscription Tiers

Run the setup script to create default tiers:

```bash
node scripts/setup-subscription-tiers.js
```

### 4. Setup Stripe Products

Run the Stripe setup script:

```bash
node scripts/setup-stripe-products.js
```

### 5. Migrate Existing Partners

Set all existing partners to Basic tier:

```bash
node scripts/migrate-partners-to-basic-tier.js
```

## 🚀 New Features

### 1. Admin System Configuration

**Location**: `/admin/system-config`

- **Subscription Tiers Management**: Edit tier names, prices, and status
- **Real-time Updates**: Changes are saved immediately
- **Visual Interface**: Clean card-based layout for each tier

### 2. Enhanced Partner Registration

**Location**: `/auth/register/partner`

- **Two-Step Process**: Registration → Subscription Selection
- **Tier Selection**: Visual cards showing all available tiers
- **Stripe Checkout**: Secure payment processing
- **Success Page**: Confirmation and next steps

### 3. Stripe Integration

**API Endpoints**:
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/verify-session` - Verify payment completion
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

**Webhook Events Handled**:
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancellation
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment

### 4. Payment Tracking

**Database Tables**:
- `SubscriptionPayment` - Complete payment history
- `Subscription` - Active subscription details
- Automatic status updates via webhooks

## 🔄 Billing Cycle

- **Frequency**: Every 28 days
- **Start Date**: Partner registration date
- **Grace Period**: 3 days for failed payments
- **Auto-Retry**: Stripe handles retry logic

## 🛠️ Configuration

### Subscription Tiers

Default tiers can be modified in `/admin/system-config`:

| Tier | Price | Description |
|------|-------|-------------|
| Basic | £19 | Perfect for small businesses |
| Plus | £20 | Great for growing businesses |
| Premium | £21 | Ideal for established businesses |
| Elite | £22 | For large businesses with premium features |

### Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to environment variables

## 📱 User Experience

### Partner Registration Flow

1. **Step 1**: Fill out business registration form
2. **Step 2**: Select subscription tier
3. **Payment**: Redirected to Stripe Checkout
4. **Success**: Account activated with subscription

### Admin Management

- View and edit subscription tiers
- Monitor partner subscriptions
- Track payment history
- Manage billing cycles

## 🔍 Testing

### Test the Complete Flow

1. **Register a Partner**:
   - Go to `/auth/register/partner`
   - Fill out the form
   - Select a subscription tier
   - Complete Stripe checkout

2. **Verify in Admin**:
   - Check `/admin/system-config` for tier management
   - Verify subscription is active

3. **Test Webhooks**:
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Test subscription events

## 🚨 Important Notes

1. **Environment Variables**: Ensure all Stripe keys are properly set
2. **Webhook Security**: Always verify webhook signatures
3. **Error Handling**: Monitor failed payments and subscription issues
4. **Data Backup**: Regular backups of subscription data
5. **Testing**: Use Stripe test mode for development

## 📞 Support

For issues with the subscription system:
1. Check Stripe Dashboard for payment status
2. Review webhook logs in application
3. Verify database subscription records
4. Check environment variable configuration

## 🔄 Future Enhancements

- **Proration**: Handle mid-cycle tier changes
- **Discounts**: Promotional pricing and coupons
- **Analytics**: Subscription metrics and reporting
- **Dunning Management**: Advanced failed payment handling
- **Multi-currency**: Support for different currencies




