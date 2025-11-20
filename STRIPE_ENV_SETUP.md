# Stripe Environment Variables Setup

## Required Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration (Required)
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your Stripe webhook secret

# Application URL (Required for Stripe checkout)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # For production

# Optional: Custom Product IDs (auto-generated if not provided)
STRIPE_BASIC_PRODUCT_ID=prod_basic
STRIPE_PLUS_PRODUCT_ID=prod_plus
STRIPE_PREMIUM_PRODUCT_ID=prod_premium
STRIPE_ELITE_PRODUCT_ID=prod_elite
```

## Getting Your Stripe Keys

### 1. Stripe Secret Key
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API Keys**
3. Copy the **Secret key** (starts with `sk_test_` for test mode)

### 2. Stripe Webhook Secret
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Click on the webhook to view details
7. Copy the **Signing secret** (starts with `whsec_`)

## Testing

### Development
- Use `http://localhost:3000` for `NEXT_PUBLIC_APP_URL`
- Use Stripe test mode keys
- Test with Stripe test card numbers

### Production
- Use your actual domain for `NEXT_PUBLIC_APP_URL`
- Use Stripe live mode keys
- Ensure HTTPS is enabled

## Common Issues

### 1. "Invalid URL" Error
- **Cause**: `NEXT_PUBLIC_APP_URL` is missing or doesn't include protocol
- **Fix**: Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` (or your domain)

### 2. "Invalid API Key" Error
- **Cause**: `STRIPE_SECRET_KEY` is missing or incorrect
- **Fix**: Verify your Stripe secret key is correct

### 3. Webhook Verification Failed
- **Cause**: `STRIPE_WEBHOOK_SECRET` is missing or incorrect
- **Fix**: Verify your webhook secret matches the one in Stripe Dashboard

## Test Card Numbers

Use these test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Expiry: Any future date (e.g., `12/34`)
CVC: Any 3 digits (e.g., `123`)




