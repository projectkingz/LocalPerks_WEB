# Setting Up Social Authentication

This guide explains how to set up social authentication with Google, Microsoft, and Facebook for the Rewards Dashboard.

## Prerequisites

1. Make sure you have a `.env` file in your project root
2. Set the basic NextAuth configuration:
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-generated-secret"
   ```

## Google Authentication

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create a new OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`
6. Add these environment variables to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   NEXT_PUBLIC_GOOGLE_ENABLED="true"
   ```

## Microsoft Authentication

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Register a new application in Azure Active Directory
3. Add a new platform under "Authentication" and select "Web"
4. Set the redirect URI to: `http://localhost:3000/api/auth/callback/azure-ad`
5. Add these environment variables to your `.env` file:
   ```env
   MICROSOFT_CLIENT_ID="your-client-id"
   MICROSOFT_CLIENT_SECRET="your-client-secret"
   MICROSOFT_TENANT_ID="your-tenant-id"
   NEXT_PUBLIC_MICROSOFT_ENABLED="true"
   ```

## Facebook Authentication

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add the Facebook Login product
4. Set the OAuth redirect URI to: `http://localhost:3000/api/auth/callback/facebook`
5. Add these environment variables to your `.env` file:
   ```env
   FACEBOOK_CLIENT_ID="your-app-id"
   FACEBOOK_CLIENT_SECRET="your-app-secret"
   NEXT_PUBLIC_FACEBOOK_ENABLED="true"
   ```

## Testing Social Login

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/auth/signin`
3. You should see buttons for each enabled social provider
4. Click any of the social login buttons to test the authentication

## Notes

- For production, update the `NEXTAUTH_URL` and OAuth redirect URIs to your production domain
- Keep your client secrets secure and never commit them to version control
- Social login users will be automatically assigned to the default tenant with a CUSTOMER role
- You can enable/disable individual providers by setting their respective `