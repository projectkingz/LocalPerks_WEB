# 🗄️ Production Database Setup Guide

## 🚀 **Option 1: PlanetScale (Recommended)**

### **Step 1: Create PlanetScale Account**
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### **Step 2: Create Database**
1. Click "Create database"
2. Name: `localperks-production`
3. Region: Choose closest to your users
4. Plan: **Hobby** (Free tier)

### **Step 3: Get Connection String**
1. Go to your database dashboard
2. Click "Connect"
3. Select "Prisma" from the dropdown
4. Copy the connection string

### **Step 4: Update Environment Variables**
Add to your Vercel environment variables:
```
DATABASE_URL="mysql://username:password@host:port/database?sslaccept=strict"
```

### **Step 5: Deploy Schema**
```bash
# Install PlanetScale CLI
npm install -g @planetscale/cli

# Login to PlanetScale
pscale auth login

# Create branch for production
pscale branch create localperks-production main

# Push schema
npx prisma db push
```

---

## 🐘 **Option 2: Supabase (Alternative)**

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project
4. Name: `localperks-production`

### **Step 2: Get Connection String**
1. Go to Settings > Database
2. Copy the connection string
3. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### **Step 3: Update Prisma Schema**
Change `provider` in `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### **Step 4: Deploy Schema**
```bash
npx prisma db push
```

---

## 🔧 **Current Database Schema**

Your app uses these main tables:
- `User` - Customer and partner accounts
- `Tenant` - Partner businesses
- `Reward` - Available rewards
- `Voucher` - Customer vouchers
- `Transaction` - Point transactions
- `Customer` - Customer profiles

---

## 📊 **Database Requirements**

### **Storage:**
- **Estimated size**: 50-100MB for 10,000 users
- **Growth rate**: ~1MB per 100 users

### **Performance:**
- **Reads**: High (dashboard, rewards, transactions)
- **Writes**: Medium (transactions, vouchers)
- **Concurrent users**: 100-1000

---

## 🚀 **Quick Setup Commands**

### **For PlanetScale:**
```bash
# Install CLI
npm install -g @planetscale/cli

# Login
pscale auth login

# Create database
pscale database create localperks-production

# Get connection string
pscale connect localperks-production main

# Deploy schema
npx prisma db push
```

### **For Supabase:**
```bash
# Update schema.prisma provider to postgresql
# Deploy schema
npx prisma db push
```

---

## 🔐 **Environment Variables for Vercel**

Add these to your Vercel project settings:

### **Required:**
```
DATABASE_URL=your_production_database_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-vercel-app.vercel.app
```

### **Optional (for email features):**
```
RESEND_API_KEY=your_resend_api_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---

## 📱 **Mobile App Database Connection**

Once production database is set up:
1. Update mobile app API URLs
2. Test all features with production data
3. Verify real-time updates work

---

## 🎯 **Recommended Next Steps**

1. **Choose database provider** (PlanetScale recommended)
2. **Set up production database**
3. **Deploy schema**
4. **Update Vercel environment variables**
5. **Test web app with production database**
6. **Update mobile app API URLs**

---

## 💡 **Pro Tips**

- **Start with PlanetScale** - easiest setup
- **Use connection pooling** for better performance
- **Set up monitoring** for database health
- **Backup regularly** (PlanetScale does this automatically)
- **Use indexes** for frequently queried fields

**Ready to set up your production database? Let's go! 🚀**
