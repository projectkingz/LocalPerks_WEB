# Redis Connection Fix Instructions

## Problem
Your Redis instance `full-leech-47632.upstash.io` cannot be found. This usually means:
- The instance was deleted
- The instance was paused (free tier instances auto-pause after inactivity)
- The URL is incorrect

## Solution: Set Up New Upstash Redis Instance

### Step 1: Create/Reactivate Upstash Redis Instance

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign in or create an account
3. Click **"Create Database"** or find your existing database
4. Choose:
   - **Region**: Select closest to you (e.g., `eu-west-1` for UK)
   - **Type**: Redis
   - **Plan**: Free tier is fine for development
5. Click **"Create"**

### Step 2: Get Your Redis Credentials

1. Once created, click on your Redis database
2. Go to the **"REST API"** tab
3. Copy:
   - **UPSTASH_REDIS_REST_URL**: The REST URL (starts with `https://`)
   - **UPSTASH_REDIS_REST_TOKEN**: The REST TOKEN

### Step 3: Update Your .env File

Open your `.env` file and update these lines:

```env
UPSTASH_REDIS_REST_URL=https://your-new-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-new-token-here
```

**Important:**
- Remove any quotes around the values
- No trailing spaces
- Make sure the URL starts with `https://`

### Step 4: Test the Connection

Run the test script:
```bash
node test-redis-connection.js
```

You should see: `✅ All Redis tests passed!`

### Step 5: Restart Your Dev Server

After updating `.env`, restart your Next.js server:
```bash
npm run dev
```

## Alternative: Use Memory Fallback (No Redis)

If you don't want to use Redis, you can remove or comment out the Redis variables in `.env`:

```env
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

The app will automatically use in-memory storage, which works fine for development.

## Troubleshooting

### If you get "fetch failed" error:
- Check your internet connection
- Verify the URL is correct (should be `https://something.upstash.io`)
- Make sure the instance is not paused (reactivate it in Upstash console)

### If you get "unauthorized" error:
- Verify the token is correct
- Make sure there are no extra spaces in the token
- Copy the token directly from Upstash console (don't type it)

### If DNS lookup fails:
- The instance might be deleted - create a new one
- Check if the instance is paused and reactivate it
- Verify the URL format is correct

