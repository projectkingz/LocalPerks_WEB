# 🔧 **CRITICAL: Environment Variables Setup**

## 🚨 **REQUIRED FOR PRODUCTION DEPLOYMENT**

Copy these environment variables to your Vercel dashboard:

### **🔑 ESSENTIAL VARIABLES (MUST HAVE)**

```bash
# Database Connection
DATABASE_URL=mysql://username:password@host/database?sslaccept=strict

# NextAuth Security
NEXTAUTH_SECRET=your-super-secret-key-at-least-32-characters-long
NEXTAUTH_URL=https://your-app-name.vercel.app

# Production Mode
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

### **📧 OPTIONAL VARIABLES (RECOMMENDED)**

```bash
# Email (for password reset)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Social Login
GOOGLE_ID=your-google-client-id.googleusercontent.com
GOOGLE_SECRET=your-google-client-secret
FACEBOOK_ID=your-facebook-app-id
FACEBOOK_SECRET=your-facebook-app-secret

# SMS (for 2FA)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🚀 **How to Add to Vercel:**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your LocalPerks project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with **Production** environment selected
5. Redeploy: `vercel --prod`

## ⚠️ **CURRENT ISSUE:**
Your app is failing because these environment variables are missing!

