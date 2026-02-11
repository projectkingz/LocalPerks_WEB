# Mailtrap Email Service Integration

This project uses Mailtrap for email sending in development and testing environments. Mailtrap captures all emails sent by the application, allowing you to test email functionality without sending real emails.

## Setup Instructions

### 1. Create a Mailtrap Account

1. Go to [https://mailtrap.io](https://mailtrap.io)
2. Sign up for a free account (or log in if you already have one)
3. Navigate to your **Inboxes** section

### 2. Get Your SMTP Credentials

1. In Mailtrap, go to **Email Testing** → **Inboxes**
2. Select your inbox (or create a new one)
3. Click on **SMTP Settings**
4. Select **Nodemailer** from the dropdown
5. Copy the following credentials:
   - **Host**: `sandbox.smtp.mailtrap.io` (for testing)
   - **Port**: `2525`
   - **Username**: Your Mailtrap username
   - **Password**: Your Mailtrap password

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Mailtrap Email Service
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASSWORD=your_mailtrap_password
```

Replace `your_mailtrap_username` and `your_mailtrap_password` with your actual Mailtrap credentials.

### 4. For Production

If you want to use Mailtrap in production, you can:

1. Use Mailtrap's production SMTP server (if you have a paid plan)
2. Or switch to another email service (SendGrid, AWS SES, etc.)

For production with Mailtrap, update your environment variables:

```env
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_production_username
MAILTRAP_PASSWORD=your_production_password
```

## Features

- **Email Testing**: All emails are captured in your Mailtrap inbox
- **No Real Emails**: Emails never reach real recipients during development
- **Email Preview**: View HTML and text versions of emails
- **Email Analytics**: See email delivery statistics
- **Spam Testing**: Check spam score and email quality

## Email Types Supported

The following email types are sent via Mailtrap:

1. **Verification Code Emails**: 2FA verification codes for login/registration
2. **Email Verification Links**: Account verification emails
3. **Password Reset Emails**: (if implemented)

## Testing

1. Start your development server: `npm run dev`
2. Trigger an email action (e.g., sign up, request verification code)
3. Check your Mailtrap inbox to see the captured email
4. Click on the email to view its content, HTML, and text versions

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**: Ensure all Mailtrap credentials are set correctly
2. **Verify Credentials**: Double-check your username and password in Mailtrap
3. **Check Console Logs**: Look for error messages in your server console
4. **Test Connection**: Try sending a test email from Mailtrap's dashboard

### Development Mode Fallback

If Mailtrap is not configured, the application will:
- Log email details to the console instead of sending
- Display a warning message
- Continue functioning (emails just won't be sent)

## Migration from Resend

This project previously used Resend for email sending. The migration to Mailtrap includes:

- ✅ Replaced Resend SDK with nodemailer
- ✅ Updated all email sending functions
- ✅ Added Mailtrap configuration
- ✅ Maintained backward compatibility (fallback to console logging)

You can remove the `RESEND_API_KEY` from your environment variables if you're no longer using Resend.

## Additional Resources

- [Mailtrap Documentation](https://mailtrap.io/docs/)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Mailtrap SMTP Settings](https://mailtrap.io/docs/smtp-settings/)


