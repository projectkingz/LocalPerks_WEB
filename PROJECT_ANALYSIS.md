# LocalPerks_WEB - Project Analysis

**Date**: November 7, 2025  
**Location**: `C:\0_LocalPerks\LocalPerks_WEB`

---

## 📋 Project Overview

**LocalPerks_WEB** is a modern, full-stack rewards and loyalty program platform built with Next.js. It enables local businesses to build customer loyalty through a points-based reward system. The platform supports multiple user roles (Admin, Partner, Customer, Tenant) and provides both web and mobile app integration.

### Key Features
- ✅ Multi-tenant architecture
- ✅ Points-based reward system (configurable per tenant)
- ✅ QR code scanning for transactions
- ✅ Voucher system
- ✅ Stripe subscription integration
- ✅ Role-based access control (Admin, Partner, Customer, Tenant)
- ✅ Transaction approval workflow
- ✅ Mobile app API integration
- ✅ Email/WhatsApp verification
- ✅ 2FA authentication support

---

## 🛠️ Technology Stack

### Frontend/Backend Framework
- **Next.js 14.2.29** (App Router)
- **React 18.3.1**
- **TypeScript 5.8.3**

### Database & ORM
- **Prisma 6.18.0**
- **MySQL** (via Prisma)
- **Prisma Client 6.16.3**

### Authentication
- **NextAuth 4.24.11**
- **@auth/prisma-adapter 2.9.1**
- **bcryptjs 2.4.3** (password hashing)

### Payment Processing
- **Stripe 19.1.0** (subscriptions & payments)

### UI/UX Libraries
- **Tailwind CSS 3.3.0**
- **Framer Motion 12.16.0** (animations)
- **Lucide React 0.513.0** (icons)
- **Heroicons React 2.1.1** (icons)
- **React Hot Toast 2.5.2** (notifications)

### Additional Services
- **Resend 4.5.2** (email)
- **Twilio 5.7.0** (SMS/WhatsApp)
- **Upstash Redis 1.35.0** (caching)
- **html5-qrcode 2.3.8** (QR scanning)
- **PDFKit 0.17.1** (PDF generation)

### Development Tools
- **ESLint 8.57.1**
- **ts-node 10.9.2**
- **Express** (separate backend server)

---

## 🏗️ Architecture

### Project Structure
```
LocalPerks_WEB/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (authenticated)/    # Protected routes
│   │   ├── admin/              # Admin dashboard
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages
│   │   ├── customer/           # Customer pages
│   │   ├── partner/            # Partner pages
│   │   └── test/               # Test pages
│   ├── components/             # Reusable components
│   ├── lib/                    # Utility libraries
│   │   ├── auth/               # Auth utilities
│   │   ├── email/              # Email utilities
│   │   └── utils/              # General utilities
│   ├── middleware/             # Next.js middleware
│   └── types/                  # TypeScript types
├── backend/                    # Separate Express server
│   └── src/
│       └── index.ts            # Express app entry
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── scripts/                    # Utility scripts
└── docs/                       # Documentation
```

### Multi-Tenant Architecture
- Each **Tenant** represents a business/partner
- **Customers** can transact with multiple tenants
- **Points configuration** is tenant-specific
- **Rewards** are scoped to tenants
- **Transactions** are linked to both customer and tenant

---

## 🗄️ Database Schema Overview

### Core Models

#### User Management
- **User**: Base user model (email, role, password, points, tenantId)
- **Account**: OAuth accounts (NextAuth)
- **Session**: User sessions (NextAuth)
- **Admin**: Admin profile extension
- **Customer**: Customer profile (separate from User)

#### Business Logic
- **Tenant**: Business/partner entity
- **Transaction**: Points transactions (pending/approved)
- **Reward**: Rewards offered by tenants
- **Redemption**: Customer reward redemptions
- **Voucher**: Generated vouchers from redemptions

#### Configuration
- **TenantPointsConfig**: Per-tenant points calculation rules
- **SystemConfig**: Global system settings
- **SubscriptionTier**: Available subscription tiers
- **Subscription**: Tenant subscriptions
- **SubscriptionPayment**: Payment records

#### Activity Tracking
- **Activity**: User activity log
- **VerificationToken**: Email/SMS verification tokens

### Key Relationships
- User → Tenant (many-to-one, optional)
- Tenant → Partner User (one-to-one)
- Customer → Tenant (many-to-one, optional)
- Transaction → Customer + Tenant + User
- Reward → Tenant (many-to-one)
- Redemption → Reward + Customer
- Voucher → Redemption (one-to-one)

---

## 🔌 API Structure

### Authentication APIs (`/api/auth/`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/register/admin` - Admin registration
- `POST /api/auth/register/partner` - Partner registration
- `POST /api/auth/register/customer` - Customer registration
- `POST /api/auth/register/tenant` - Tenant registration
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/verify-mobile` - Mobile verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/2fa/send` - Send 2FA code
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `[...nextauth]` - NextAuth endpoints

### Transaction APIs (`/api/transactions`)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions

### Points APIs (`/api/points/`)
- `GET /api/points/config` - Get tenant points config
- `GET /api/points/history` - Points history
- `GET /api/points/mobile` - Mobile points endpoint

### Rewards APIs (`/api/rewards/`)
- `GET /api/rewards` - List rewards
- `POST /api/rewards` - Create reward
- `GET /api/rewards/[id]` - Get reward
- `POST /api/rewards/[id]/redeem` - Redeem reward
- `GET /api/rewards/vouchers` - List vouchers
- `GET /api/rewards/vouchers/mobile` - Mobile vouchers

### Admin APIs (`/api/admin/`)
- `GET /api/admin/customers` - List customers
- `GET /api/admin/users` - List users
- `GET /api/admin/rewards` - List rewards
- `GET /api/admin/redemptions` - List redemptions
- `GET /api/admin/pending-transactions` - Pending transactions
- `GET /api/admin/subscriptions` - Subscriptions
- `POST /api/admin/users/[id]/approve` - Approve user
- `POST /api/admin/users/[id]/suspend` - Suspend user

### Partner APIs (`/api/partner/`)
- `GET /api/partner/stats` - Partner statistics
- `GET /api/partner/subscription-status` - Subscription status

### Tenant APIs (`/api/tenants/`)
- `GET /api/tenants/[tenantId]` - Get tenant
- `GET /api/tenants/[tenantId]/points-config` - Points config
- `GET /api/tenants/[tenantId]/points-config/mobile` - Mobile config

### Stripe APIs (`/api/stripe/`)
- `POST /api/stripe/create-checkout-session` - Create checkout
- `POST /api/stripe/verify-session` - Verify session
- `POST /api/webhooks/stripe` - Stripe webhooks

---

## 📁 Key Files & Directories

### Configuration Files
- `next.config.js` - Next.js configuration (build optimizations, webpack config)
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `vercel.json` - Vercel deployment config
- `.env` - Environment variables (not in repo)

### Database
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Database seeding script

### Core Libraries (`src/lib/`)
- `prisma.ts` - Prisma client instance
- `auth.ts` - NextAuth configuration
- `pointsCalculation.ts` - Points calculation utility
- `pointsConfig.ts` - Default points configuration
- `stripe.ts` - Stripe client configuration
- `systemConfig.ts` - System configuration utilities
- `env.ts` - Environment variable validation

### Backend Server
- `backend/src/index.ts` - Express server (health check endpoint)

---

## ⚙️ Configuration

### Environment Variables (`.env`)
Required variables (check `.env` file):
- `DATABASE_URL` - MySQL connection string
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - Application URL
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `RESEND_API_KEY` - Email service API key
- `TWILIO_*` - Twilio credentials (SMS/WhatsApp)

### Build Configuration
- **ESLint**: Disabled during builds (`ignoreDuringBuilds: true`)
- **TypeScript**: Errors ignored during builds (`ignoreBuildErrors: true`)
- **Console logs**: Removed in production (except error/warn)
- **Bundle optimization**: Modular imports for icon libraries

---

## 🚀 Deployment

### Vercel Configuration
- **Framework**: Next.js
- **Build Command**: `npm run build:vercel`
- **Install Command**: `npm install && npx prisma generate`
- **Region**: `lhr1` (London)
- **Environment**: Auto-configured for Vercel

### Scripts (`package.json`)
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database
- `npm run prisma:seed` - Alternative seed command

---

## 🔍 Points System

### Default Configuration
- **Base Rate**: 5 points per £1 spent
- **Tiered Rewards**:
  - Standard (0-£30): 5 points/£1
  - Silver (£30.01-£75): 6 points/£1
  - Gold (£75.01+): 8 points/£1
- **Configurable**: Per-tenant via `TenantPointsConfig`

### Calculation Flow
1. Fetch tenant-specific config from database
2. Determine tier based on transaction amount
3. Apply bonus rules (day of week, date range, etc.)
4. Apply rounding rules
5. Update customer points balance

See `POINTS_SYSTEM_IMPLEMENTATION_SUMMARY.md` for details.

---

## 👥 User Roles

### Admin
- Full system access
- User approval/suspension
- Transaction approval
- System configuration
- Subscription management

### Partner
- Owns/manages one or more Tenants
- Creates rewards
- Processes transactions
- Views tenant statistics
- Subscription management

### Customer
- Earns and redeems points
- Views transaction history
- Redeems rewards for vouchers
- QR code for transactions

### Tenant
- Represents a business location
- Has tenant-specific configuration
- Owned by a Partner User

---

## 📝 Known Issues & TODOs

### TODOs Found
1. **Email Service** (`src/app/api/auth/resend-verification/route.ts:61`)
   - TODO: Implement actual email sending service

2. **WhatsApp Service** (`src/app/api/auth/resend-verification-whatsapp/route.ts:54`)
   - TODO: Implement actual WhatsApp sending service

### Configuration Notes
- ESLint and TypeScript errors are ignored during builds (temporary)
- Console logs are removed in production (except error/warn)

---

## 📚 Documentation Files

The project includes extensive documentation:
- `README.md` - Basic project info
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `ENVIRONMENT_SETUP.md` - Environment setup
- `DATABASE_SETUP.md` - Database setup
- `POINTS_SYSTEM_IMPLEMENTATION_SUMMARY.md` - Points system details
- `STRIPE_ENV_SETUP.md` - Stripe configuration
- `SUBSCRIPTION_SETUP.md` - Subscription setup
- `VERCEL_ENV_SETUP.md` - Vercel configuration
- `CRITICAL_FIXES_COMPLETED.md` - Recent fixes

---

## 🔐 Security Features

- Password hashing with bcryptjs
- NextAuth session management
- Role-based access control
- Email/SMS verification
- 2FA support
- CORS configuration
- API authentication middleware

---

## 📊 Database Statistics

### Models Count: 18
- User management: 5 models
- Business logic: 5 models
- Configuration: 4 models
- Activity tracking: 2 models
- Authentication: 2 models

### Key Indexes
- User: tenantId, role, suspended, approvalStatus
- Transaction: userId, customerId, tenantId
- Reward: tenantId, approvalStatus
- Voucher: customerId, rewardId, status, expiresAt

---

## 🎯 Next Steps / Recommendations

1. **Complete TODOs**
   - Implement email sending service
   - Implement WhatsApp sending service

2. **Code Quality**
   - Re-enable ESLint during builds
   - Fix TypeScript errors
   - Remove debug console logs

3. **Testing**
   - Add unit tests
   - Add integration tests
   - Add E2E tests

4. **Performance**
   - Implement caching strategy
   - Optimize database queries
   - Add pagination where needed

5. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - Component documentation
   - Deployment runbooks

---

## 📞 Project Status

**Status**: Production-ready (with known TODOs)  
**Last Updated**: October 28, 2025 (based on file timestamps)  
**Deployment**: Configured for Vercel  
**Database**: MySQL with Prisma ORM

---

**End of Analysis**









