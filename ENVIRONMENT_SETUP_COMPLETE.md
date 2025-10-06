# 🔧 **COMPLETE ENVIRONMENT VARIABLES SETUP**

## 🎯 **BOTH ENVIRONMENTS DEPLOYED!**

### **✅ DEPLOYMENT STATUS:**
- **Production**: https://localperks-app.vercel.app ✅
- **Development**: https://localperks-84w2wyfmk-projectkingzs-projects.vercel.app ✅

---

## 🚨 **CRITICAL: SET ENVIRONMENT VARIABLES**

### **🔗 Go to Vercel Dashboard:**
**https://vercel.com/projectkingzs-projects/localperks-app**

---

## 📋 **ENVIRONMENT VARIABLES SETUP:**

### **🎯 STRATEGY:**
- **Development**: Use same database (easier testing)
- **Production**: Can use same database initially, separate later
- **Both**: Same authentication secrets (for testing)

---

## 🔧 **STEP 1: SET DEVELOPMENT VARIABLES**

1. **Go to Vercel Dashboard**
2. **Settings** → **Environment Variables**
3. **Add these variables with "Preview" environment:**

```bash
DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your-super-secret-key-32-characters-long
NEXTAUTH_URL=https://localperks-84w2wyfmk-projectkingzs-projects.vercel.app
NODE_ENV=development
NEXT_PUBLIC_APP_URL=https://localperks-84w2wyfmk-projectkingzs-projects.vercel.app
```

---

## 🔧 **STEP 2: SET PRODUCTION VARIABLES**

1. **Same page, add these variables with "Production" environment:**

```bash
DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your-super-secret-key-32-characters-long
NEXTAUTH_URL=https://localperks-app.vercel.app
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://localperks-app.vercel.app
```

---

## 🔧 **STEP 3: REDEPLOY BOTH ENVIRONMENTS**

After setting environment variables:

```bash
# Redeploy development
vercel

# Redeploy production
vercel --prod
```

---

## 📱 **MOBILE APP CONFIGURATION:**

### **Current Configuration:**
Your mobile app is configured to use production API:
```typescript
// In LocalPerks_APP/src/config/api.ts
const PROD_API_URL = "https://localperks-app.vercel.app/api";
const DEV_API_URL = "http://192.168.5.213:3000/api"; // Local development
```

### **Option A: Test with Production API (Current)**
- Mobile app → Production API ✅
- Good for testing production features

### **Option B: Test with Development API**
Update mobile app to use development URL:
```typescript
const PROD_API_URL = "https://localperks-84w2wyfmk-projectkingzs-projects.vercel.app/api";
```

---

## 🧪 **TESTING BOTH ENVIRONMENTS:**

### **1. Test Development:**
- **URL**: https://localperks-84w2wyfmk-projectkingzs-projects.vercel.app
- **Features**: Same as production
- **Database**: Shared (for now)

### **2. Test Production:**
- **URL**: https://localperks-app.vercel.app
- **Features**: Live production features
- **Database**: Shared (for now)

### **3. Test Mobile App:**
```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_APP"
npx expo start
```

---

## 📊 **ENVIRONMENT COMPARISON:**

| Feature | Development | Production |
|---------|-------------|------------|
| **URL** | Preview URL | Production URL |
| **Database** | Shared | Shared |
| **Secrets** | Same | Same |
| **Purpose** | Testing | Live Users |
| **Mobile API** | Can switch | Current setup |

---

## 🔄 **FUTURE IMPROVEMENTS:**

### **Separate Databases (Recommended Later):**
1. **Development Database**: For testing new features
2. **Production Database**: For live users
3. **Different Secrets**: Better security

### **Environment-Specific Configs:**
1. **Development**: Debug mode, test data
2. **Production**: Optimized, real data

---

## 🚀 **QUICK COMMANDS:**

### **Deploy Development:**
```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_WEB"
vercel
```

### **Deploy Production:**
```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_WEB"
vercel --prod
```

### **Test Mobile App:**
```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_APP"
npx expo start
```

---

## ✅ **NEXT STEPS:**

1. **Set environment variables in Vercel** (5 minutes)
2. **Redeploy both environments** (2 minutes)
3. **Test both URLs** (5 minutes)
4. **Test mobile app** (5 minutes)

**🎉 You now have both development and production environments! 🎉**
