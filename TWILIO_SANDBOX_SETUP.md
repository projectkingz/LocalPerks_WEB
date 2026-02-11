# Twilio Sandbox Setup - Important Notes

## The Issue

You cannot use the Twilio sandbox number (`+14155238886`) as both the **FROM** and **TO** number.

- ❌ **FROM**: `+14155238886` (sandbox)
- ❌ **TO**: `+14155238886` (same number)
- **Error**: "Message cannot have the same To and From"

## Correct Setup

### Sandbox Number (FROM)
- **Use for**: `TWILIO_WHATSAPP_NUMBER` in `.env`
- **Value**: `whatsapp:+14155238886`
- **Purpose**: This is where messages come FROM

### User Mobile Numbers (TO)
- **Use for**: User mobile numbers in database
- **Value**: Any valid phone number **EXCEPT** the sandbox number
- **Examples**: 
  - `+447402611112` (UK test number)
  - `+1234567890` (US test number)
  - Any real user phone number

## How It Works

1. **User registers/logs in** with mobile number: `+447402611112`
2. **System sends WhatsApp**:
   - FROM: `whatsapp:+14155238886` (sandbox)
   - TO: `whatsapp:+447402611112` (user's number)
3. **User receives code** on their WhatsApp

## Sandbox Requirements

For users to receive WhatsApp messages from the sandbox:

1. **User must join sandbox first**:
   - Send WhatsApp message to: `+1 415 523 8886`
   - Message: `join <your-sandbox-keyword>`
   - Get keyword from: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

2. **After joining**, user can receive messages

3. **If user hasn't joined**, system will:
   - Try WhatsApp (fails silently)
   - Automatically fallback to SMS
   - User receives SMS instead

## Current Configuration

### .env
```env
TWILIO_ACCOUNT_SID=AC8686fa331140ab20ab49de23e649a8a3
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # FROM number
TWILIO_PHONE_NUMBER=+14155238886               # SMS FROM number
```

### Database
- User mobile numbers: `+447402611112` (or any number ≠ sandbox number)

## Testing

### Test with Sandbox User
1. Join sandbox: Send `join <keyword>` to `+1 415 523 8886`
2. Register/login with your phone number
3. Should receive WhatsApp message

### Test with Non-Sandbox User
1. Register/login with any phone number (not in sandbox)
2. System tries WhatsApp (fails)
3. Automatically sends SMS instead
4. User receives SMS code

## Production Setup

For production, you'll need:
1. **WhatsApp Business API** approval from Twilio
2. **Approved WhatsApp Business number** (not sandbox)
3. Update `TWILIO_WHATSAPP_NUMBER` to your production number
4. No sandbox limitations - works for all users

## Summary

- ✅ **Sandbox number** (`+14155238886`) = FROM number only
- ✅ **User numbers** = Any number except sandbox number
- ✅ **SMS fallback** = Automatic if WhatsApp fails
- ✅ **Sandbox join** = Required for users to receive WhatsApp






