# 🚀 LocalPerks Deployment Guide

## 🌐 Web App Deployment (Next.js)

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (Already done):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add these environment variables:
     - `DATABASE_URL` (your production database URL)
     - `NEXTAUTH_SECRET` (generate a new secret)
     - `NEXTAUTH_URL` (your Vercel domain)

### Option 2: Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `.next` folder to Netlify
   - Or connect your GitHub repository

### Option 3: Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

## 📱 Mobile App Deployment (React Native)

### Option 1: Expo (Recommended for Testing)

1. **Install Expo CLI**:
   ```bash
   npm install -g @expo/cli
   ```

2. **Login to Expo**:
   ```bash
   expo login
   ```

3. **Build for Web**:
   ```bash
   expo build:web
   ```

4. **Deploy to Expo**:
   ```bash
   expo publish
   ```

### Option 2: EAS Build (Production)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Build for Android**:
   ```bash
   eas build --platform android
   ```

4. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```

## 🗄️ Database Deployment

### Option 1: PlanetScale (MySQL)
- Free tier available
- Easy Prisma integration
- Automatic backups

### Option 2: Supabase (PostgreSQL)
- Free tier available
- Built-in authentication
- Real-time features

### Option 3: Railway Database
- Simple setup
- Good for development

## 🔧 Pre-Deployment Checklist

### Web App:
- [ ] Update API_BASE_URL in mobile app config
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Test all API endpoints
- [ ] Update CORS settings if needed

### Mobile App:
- [ ] Update API_BASE_URL to production URL
- [ ] Test on physical devices
- [ ] Configure app icons and splash screens
- [ ] Set up app store accounts (if publishing)

## 📋 Environment Variables Needed

### Web App (.env.local):
```
DATABASE_URL="your_production_database_url"
NEXTAUTH_SECRET="your_secret_key"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

### Mobile App (src/config/api.ts):
```typescript
export const API_BASE_URL = "https://your-domain.vercel.app/api";
```

## 🚀 Quick Start Commands

### Deploy Web App to Vercel:
```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_WEB"
vercel login
vercel
```

### Deploy Mobile App to Expo:
```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_APP"
expo login
expo publish
```

## 📞 Support

If you encounter any issues:
1. Check the deployment logs
2. Verify environment variables
3. Test API endpoints manually
4. Check database connections
