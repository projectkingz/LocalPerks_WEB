# Vercel Environment Variables Setup

## Required Environment Variables for LocalPerks

Your Vercel deployment needs these environment variables to work properly:

### 🔑 **Essential Variables**

1. **`DATABASE_URL`**
   - Your PlanetScale MySQL connection string
   - Format: `mysql://username:password@host/database?sslaccept=strict`

2. **`NEXTAUTH_SECRET`**
   - Secret key for NextAuth.js JWT signing
   - Generate with: `openssl rand -base64 32`
   - Or use any secure random string (at least 32 characters)

3. **`NEXTAUTH_URL`**
   - Your Vercel app URL
   - Format: `https://your-app-name.vercel.app`

### 📧 **Optional Variables (for email features)**

4. **`RESEND_API_KEY`**
   - For email sending (password reset, 2FA, etc.)
   - Get from: https://resend.com

5. **`GOOGLE_ID` & `GOOGLE_SECRET`**
   - For Google OAuth login
   - Get from: https://console.cloud.google.com

6. **`FACEBOOK_ID` & `FACEBOOK_SECRET`**
   - For Facebook OAuth login
   - Get from: https://developers.facebook.com

## 🚀 **How to Add Variables**

### Option 1: Vercel CLI
```bash
npx vercel env add DATABASE_URL
# Paste your PlanetScale connection string

npx vercel env add NEXTAUTH_SECRET
# Enter a secure random string (32+ characters)

npx vercel env add NEXTAUTH_URL
# Enter: https://localperks-1yaix5qyl-projectkingzs-projects.vercel.app
```

### Option 2: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `localperks-app` project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with **Production** environment selected

## ✅ **After Adding Variables**

1. **Redeploy**: `npx vercel --prod`
2. **Update Mobile App**: Use correct Vercel URL in `src/config/api.ts`
3. **Test Login**: Try `tina.allen900@example.com` / `password123`

## 🔍 **Current Issue**

Your Vercel deployment has **NO environment variables**, causing:
- ❌ 401 errors (authentication fails)
- ❌ Database connection fails
- ❌ JWT signing fails

Once you add the required variables, Tina Allen login will work! 🎉
