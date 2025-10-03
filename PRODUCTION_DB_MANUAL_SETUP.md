# 🗄️ Production Database Manual Setup Guide

## 🚀 **Step-by-Step Setup (No CLI Required)**

### **Step 1: Create PlanetScale Account**
1. Go to [planetscale.com](https://planetscale.com)
2. Click "Get started for free"
3. Sign up with GitHub (recommended)
4. Verify your email address

### **Step 2: Create Database**
1. Once logged in, click "Create database"
2. **Database name**: `localperks-production`
3. **Region**: Choose closest to your users (e.g., US East)
4. **Plan**: Select "Hobby" (Free tier)
5. Click "Create database"

### **Step 3: Get Connection String**
1. Go to your database dashboard
2. Click on "localperks-production"
3. Click "Connect" button
4. Select "Prisma" from the dropdown
5. Copy the connection string (it looks like this):
   ```
   mysql://username:password@host:port/database?sslaccept=strict
   ```

### **Step 4: Update Vercel Environment Variables**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your LocalPerks project
3. Go to "Settings" → "Environment Variables"
4. Add these variables:

   **Required:**
   ```
   DATABASE_URL = mysql://username:password@host:port/database?sslaccept=strict
   NEXTAUTH_SECRET = your-secret-key-here
   NEXTAUTH_URL = https://your-app.vercel.app
   ```

   **Optional (for email features):**
   ```
   RESEND_API_KEY = your-resend-api-key
   UPSTASH_REDIS_REST_URL = your-redis-url
   UPSTASH_REDIS_REST_TOKEN = your-redis-token
   ```

### **Step 5: Deploy Database Schema**
1. Open terminal in your LocalPerks_WEB directory
2. Run these commands:

   ```bash
   # Install dependencies
   npm install

   # Generate Prisma client
   npx prisma generate

   # Deploy schema to production database
   npx prisma db push

   # Seed the database with initial data
   npx prisma db seed
   ```

### **Step 6: Verify Setup**
1. Go to your Vercel app URL
2. Try to register a new account
3. Check if data appears in PlanetScale dashboard
4. Test all features

---

## 🔄 **Alternative: Supabase Setup**

If you prefer PostgreSQL over MySQL:

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project
4. **Name**: `localperks-production`
5. **Database password**: Choose a strong password

### **Step 2: Update Prisma Schema**
Change the provider in `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "mysql" to "postgresql"
  url      = env("DATABASE_URL")
}
```

### **Step 3: Get Connection String**
1. Go to Settings → Database
2. Copy the connection string
3. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### **Step 4: Deploy Schema**
```bash
npx prisma db push
npx prisma db seed
```

---

## 📊 **Database Schema Overview**

Your app uses these main tables:
- **User** - Customer and partner accounts
- **Tenant** - Partner businesses  
- **Reward** - Available rewards
- **Voucher** - Customer vouchers
- **Transaction** - Point transactions
- **Customer** - Customer profiles

---

## 🎯 **Quick Commands Reference**

```bash
# Navigate to project
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_WEB"

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Deploy schema
npx prisma db push

# Seed database
npx prisma db seed

# View database in Prisma Studio
npx prisma studio
```

---

## 🔐 **Environment Variables Checklist**

Make sure these are set in Vercel:

- ✅ `DATABASE_URL` - Your production database connection
- ✅ `NEXTAUTH_SECRET` - Random secret for NextAuth
- ✅ `NEXTAUTH_URL` - Your Vercel app URL
- ⚠️ `RESEND_API_KEY` - For email features (optional)
- ⚠️ `UPSTASH_REDIS_REST_URL` - For caching (optional)
- ⚠️ `UPSTASH_REDIS_REST_TOKEN` - For caching (optional)

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Database not found"**
   - Check your connection string
   - Ensure database exists in PlanetScale

2. **"Authentication failed"**
   - Verify username/password in connection string
   - Check if database is active

3. **"Schema push failed"**
   - Run `npx prisma generate` first
   - Check for syntax errors in schema.prisma

4. **"Seed failed"**
   - Ensure database is empty or use `--force-reset`
   - Check seed script for errors

---

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ Vercel app loads without database errors
- ✅ You can register new accounts
- ✅ Data appears in PlanetScale dashboard
- ✅ Mobile app can connect to production API

---

## 📱 **Next Steps After Database Setup**

1. **Update mobile app API URLs** to point to production
2. **Test all features** with production database
3. **Set up monitoring** for database health
4. **Configure backups** (PlanetScale does this automatically)

**Ready to set up your production database? Let's go! 🚀**
