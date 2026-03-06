# Vonage WhatsApp + SMS 2FA Setup

The system tries **WhatsApp first**, then falls back to **SMS** if WhatsApp fails.

## Why SMS Only Right Now?

If you're only receiving SMS (not WhatsApp), the Vonage Messages API likely needs **JWT authentication**. Basic auth (API key/secret) returns 401 when your WhatsApp number is linked to an application.

## Enable WhatsApp (JWT Setup)

1. **Create a Vonage Application**
   - Go to [dashboard.nexmo.com](https://dashboard.nexmo.com/) → Applications → Create new application
   - Add "Messages" capability
   - Generate a public/private key pair
   - Save the **Application ID** and **Private Key**

2. **Link WhatsApp to the application**
   - In the Vonage Dashboard, link your WhatsApp sandbox number to this application

3. **Add to `.env.local`**
   ```bash
   VONAGE_APPLICATION_ID=your-application-id
   VONAGE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
   MIGEAgEAMBAGByqGSM49AgEGBSuBBAAKBG0wawIBAQQg...
   -----END PRIVATE KEY-----"
   ```
   For env vars, use `\n` for newlines: `VONAGE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGE...\n-----END PRIVATE KEY-----"`

4. **Sandbox for testing**
   - Set `VONAGE_MESSAGES_SANDBOX=true`
   - Users must join the WhatsApp sandbox: send a message to the sandbox number from the Vonage dashboard

## Fallback to SMS

When WhatsApp fails (or JWT isn't configured), the system falls back to:
1. **SMS via Messages API** (if `VONAGE_SMS_NUMBER` is set)
2. **Vonage Verify API** (uses `VONAGE_API_KEY` and `VONAGE_API_SECRET` only)

Vonage Verify works with just API key/secret—no JWT or extra numbers needed.
