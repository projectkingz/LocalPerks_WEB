# LocalPerks WEB

A full-stack loyalty and perks platform connecting local businesses with their customers. Built with Next.js, Prisma, TypeScript, and deployed on Vercel.

---

## Overview

LocalPerks is a multi-tenant SaaS platform with three user roles:

| Role | Description |
|---|---|
| **Customer** | Earns points at partner businesses, redeems rewards, manages their profile |
| **Partner** | Local business owner — manages rewards, views customers, tracks transactions |
| **Super Admin** | Platform-wide management, tenant configuration, analytics |

Key features include a QR-code-based points system, WhatsApp/SMS 2FA via Twilio, Stripe subscription billing, and a companion React Native mobile app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | MySQL via Prisma ORM |
| Caching | Redis |
| Auth | NextAuth + Social login |
| Payments | Stripe |
| Messaging | Twilio (WhatsApp & SMS) |
| Email | Mailtrap |
| Deployment | Vercel |
| Mobile | React Native (in `/mobile`) |

---

## Project Structure

```
LocalPerks_WEB/
├── src/                    # Next.js app (pages, components, API routes)
├── backend/                # Additional backend logic
├── mobile/                 # React Native companion app
├── prisma/                 # Database schema & migrations
├── scripts/                # One-off utility & maintenance scripts
├── docs/                   # All documentation
│   ├── DATABASE_COMPLETE_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── archive/            # Historical fix docs
├── __tests__/api/          # Jest API test suite
└── public/                 # Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- Redis (local or hosted)
- A Vercel account (for deployment)

### 1. Clone & Install

```bash
git clone https://github.com/projectkingz/LocalPerks_WEB.git
cd LocalPerks_WEB
npm install
```

### 2. Set Up Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values. See [docs/DATABASE_COMPLETE_GUIDE.md](docs/DATABASE_COMPLETE_GUIDE.md) for full database setup instructions.

Key variables to configure:

```env
DATABASE_URL=mysql://user:password@host:3306/localperks
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

### 3. Set Up Database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Testing

```bash
npm test
```

API tests are located in `__tests__/api/`. See [docs/README_TESTING.md](docs/README_TESTING.md) for more.

---

## Deployment

The app deploys automatically to Vercel on push to `main`.

For manual deployment or production setup, see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

**Required Vercel environment variables:**
- All variables from `.env.production.example`
- Ensure `DATABASE_URL` points to your production MySQL instance

---

## Mobile App

The React Native app lives in `/mobile`. It shares the same backend API.

```bash
cd mobile
npm install
npx expo start
```

---

## Documentation

All docs are in the `/docs` folder:

| Doc | Description |
|---|---|
| [DATABASE_COMPLETE_GUIDE.md](docs/DATABASE_COMPLETE_GUIDE.md) | Full DB setup, migration & troubleshooting |
| [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Vercel deployment instructions |
| [SUBSCRIPTION_SETUP.md](docs/SUBSCRIPTION_SETUP.md) | Stripe subscription configuration |
| [SOCIAL_AUTH_SETUP.md](docs/SOCIAL_AUTH_SETUP.md) | Google/social login setup |
| [TWILIO_SANDBOX_SETUP.md](docs/TWILIO_SANDBOX_SETUP.md) | WhatsApp & SMS configuration |

---

## License

Private — All rights reserved.
