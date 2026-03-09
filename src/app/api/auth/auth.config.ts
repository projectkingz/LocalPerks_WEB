import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { hasPending2FAVerification } from '@/lib/auth/two-factor';
import { logger } from '@/lib/logger';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    tenantId: string | null;
    suspended: boolean;
    approvalStatus: string;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      tenantId: string | null;
      suspended: boolean;
      approvalStatus: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    tenantId: string | null;
    provider?: string;
    suspended: boolean;
    approvalStatus: string;
    lastRefreshed?: number;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        logger.debug('Starting authorization...');
        if (!credentials?.email || !credentials?.password) {
          logger.debug('Missing credentials');
          return null;
        }

        try {
          logger.debug('Finding user:', credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              tenantId: true,
              password: true,
              suspended: true,
              approvalStatus: true,
            },
          });

          if (!user) {
            logger.debug('User not found');
            return null;
          }

          logger.debug('User found:', { id: user.id, email: user.email });

          // For users without a password (e.g., social login), deny credentials login
          if (!user.password) {
            logger.debug('User signed up with social login, cannot use email/password');
            throw new Error('SOCIAL_LOGIN_ONLY');
          }

          logger.debug('Verifying password...');

          // Check if this is a 2FA bypass (after successful 2FA verification)
          const is2FABypass = credentials.password === '__2FA_VERIFIED__';
          
          if (!is2FABypass) {
            const isPasswordValid = await compare(
              credentials.password as string,
              user.password
            );

            if (!isPasswordValid) {
              logger.debug('Invalid password');
              return null;
            }
          }

          logger.debug('Password verified successfully');

          // Define isSuspended for use in 2FA checks later
          const isSuspended = Boolean(user.suspended);

          // For PARTNERS, check approvalStatus FIRST before checking suspended
          // Partners with PENDING status should be treated as pending, not suspended
          // Note: Email/mobile verification only happens during registration, not login
          if (user.role === 'PARTNER') {
            logger.debug('Partner login - checking approvalStatus:', user.approvalStatus);

            // Handle pending approval statuses (verification statuses are only for registration)
            if (user.approvalStatus === 'PENDING' || user.approvalStatus === 'PENDING_ADMIN_APPROVAL' || user.approvalStatus === 'UNDER_REVIEW') {
              logger.debug('Partner account is pending approval');
              throw new Error('PENDING_APPROVAL');
            } else if (user.approvalStatus === 'PENDING_PAYMENT') {
              throw new Error('PENDING_PAYMENT');
            } else if (user.approvalStatus !== 'ACTIVE') {
              throw new Error('ACCOUNT_NOT_APPROVED');
            }
            
            // Only check suspended if partner is ACTIVE
            if (isSuspended) {
              logger.debug('Partner account is suspended');
              throw new Error('ACCOUNT_SUSPENDED');
            }
          } else {
            // For non-partners, check suspended status first
            if (isSuspended) {
              logger.debug('Account is suspended, throwing specific error');

              // For customers - verification statuses are only for registration, not login
              if (user.role === 'CUSTOMER') {
                throw new Error('ACCOUNT_SUSPENDED');
              }
              // For other roles (ADMIN, SUPER_ADMIN)
              else if (user.approvalStatus === 'UNDER_REVIEW') {
                throw new Error('ACCOUNT_UNDER_REVIEW');
              } else if (user.approvalStatus === 'PENDING_ADMIN_APPROVAL') {
                throw new Error('PENDING_APPROVAL');
              } else {
                throw new Error('ACCOUNT_SUSPENDED');
              }
            }
          }

          // Skip 2FA checks if this is a post-2FA-verification login
          if (!is2FABypass) {
            // Check if 2FA verification is pending
            const has2FA = await hasPending2FAVerification(user.id);
            if (has2FA) {
              logger.debug('2FA verification required');
              throw new Error('2FA_REQUIRED');
            }

            // For active partners, require 2FA login
            if (user.role === 'PARTNER' && !isSuspended && user.approvalStatus === 'ACTIVE') {
              logger.debug('Partner login - 2FA required');
              throw new Error('PARTNER_2FA_REQUIRED');
            }

            // For active customers, require 2FA login
            if (user.role === 'CUSTOMER' && !isSuspended && user.approvalStatus === 'ACTIVE') {
              logger.debug('Customer login - 2FA required');
              throw new Error('CUSTOMER_2FA_REQUIRED');
            }
          } else {
            logger.debug('2FA bypass - already verified');
          }

          logger.debug('Authorization successful');
          
          // Return user data
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            suspended: Boolean(user.suspended),
            approvalStatus: user.approvalStatus,
          };
        } catch (error: any) {
          // Re-throw specific errors so they can be caught by the client
          // These are expected errors that trigger redirects, not actual failures
          if (error.message && (
            error.message.startsWith('ACCOUNT_') || 
            error.message.startsWith('EMAIL_') || 
            error.message.startsWith('PENDING_') ||
            error.message.startsWith('PARTNER_') ||
            error.message.startsWith('CUSTOMER_') ||
            error.message === '2FA_REQUIRED'
          )) {
            // Don't log these as errors - they're expected flow control
            throw error;
          }
          // Only log unexpected errors
          logger.error('Error in authorize:', error);
          return null;
        }
      }
    }),
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET ? [
      Google({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
      })
    ] : []),
    ...(process.env.FACEBOOK_ID && process.env.FACEBOOK_SECRET ? [
      Facebook({
        clientId: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
      })
    ] : []),

  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      logger.debug('SignIn callback - account provider:', account?.provider);

      // For social logins, enforce authentication method consistency
      if (account?.provider !== 'credentials') {
        try {
          logger.debug('Processing social login for:', user.email);

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true }
          });

          if (existingUser) {
            // Check if user has a password (email/password signup)
            const hasPassword = existingUser.password !== null;
            
            // Check if user has any OAuth accounts
            const hasOAuthAccounts = existingUser.accounts.length > 0;
            
            // Check if they have an account with this specific provider
            const hasThisProviderAccount = existingUser.accounts.some(
              (acc: any) => acc.provider === account?.provider
            );
            
            // If user signed up with email/password, they can't use social login
            if (hasPassword && !hasOAuthAccounts) {
              logger.debug('User signed up with email/password, blocking social login');
              return '/auth/signin?error=email_password_only';
            }
            
            // If user signed up with a different social provider, they can't use this one
            if (hasOAuthAccounts && !hasThisProviderAccount) {
              logger.debug('User signed up with different social provider, blocking this provider');
              return '/auth/signin?error=wrong_social_provider';
            }
            
            // If user has this provider account, allow login
            if (hasThisProviderAccount) {
              return true;
            }
            
            // If user has no password and no OAuth accounts (edge case), allow linking
            if (!hasPassword && !hasOAuthAccounts && account) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                }
              });

              // Ensure customer record exists for this user (only for CUSTOMER role)
              if (existingUser.role === 'CUSTOMER') {
                const existingCustomer = await prisma.customer.findUnique({
                  where: { email: existingUser.email }
                });

                if (!existingCustomer) {
                  logger.debug('Creating customer record for existing CUSTOMER user');

                  // Generate unique display ID (uses shared client with Accelerate)
                  const { generateUniqueDisplayId } = await import('@/lib/customerId');
                  const displayId = await generateUniqueDisplayId();
                  
                  // Create customer record without specific tenant assignment
                  // Customers can transact with any tenant
                  await prisma.customer.create({
                    data: {
                      email: existingUser.email,
                      name: existingUser.name || '',
                      mobile: '000-000-0000', // Default mobile for social login users
                      tenantId: null, // No specific tenant - can transact with any
                      displayId: displayId,
                    }
                  });
                }
              }
            }
          }
        } catch (error) {
          logger.error('Error during social sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.suspended = user.suspended;
        token.approvalStatus = user.approvalStatus;
        token.lastRefreshed = Date.now();
      }
      if (account) {
        token.provider = account.provider;
      }
      // Refresh suspension/approval status from DB every 60 seconds so
      // admin actions (suspend, revoke) take effect without requiring re-login.
      if (token.id && !user) {
        const now = Date.now();
        const lastRefreshed = (token.lastRefreshed as number) || 0;
        if (now - lastRefreshed > 60 * 1000) {
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { suspended: true, approvalStatus: true },
            });
            if (freshUser) {
              token.suspended = freshUser.suspended;
              token.approvalStatus = freshUser.approvalStatus;
              token.lastRefreshed = now;
            }
          } catch {
            // Keep cached values on DB error - fail open
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tenantId = token.tenantId;
        session.user.suspended = token.suspended;
        session.user.approvalStatus = token.approvalStatus;
        
        // Ensure customer record exists for this user (only for CUSTOMER role)
        try {
          // Only create Customer records for users with CUSTOMER role
          if (session.user.role === 'CUSTOMER') {
            const existingCustomer = await prisma.customer.findUnique({
              where: { email: session.user.email! }
            });

            if (!existingCustomer) {
              logger.debug('Creating customer record for CUSTOMER user in session callback');

              // Generate unique display ID (uses shared client with Accelerate)
              const { generateUniqueDisplayId } = await import('@/lib/customerId');
              const displayId = await generateUniqueDisplayId();
              
              // Create customer record without specific tenant assignment
              // Customers can transact with any tenant
              await prisma.customer.create({
                data: {
                  email: session.user.email!,
                  name: session.user.name || '',
                  mobile: '000-000-0000', // Default mobile for social login users
                  tenantId: null, // No specific tenant - can transact with any
                  displayId: displayId,
                }
              });
            }
          }
        } catch (error) {
          logger.error('Error ensuring customer record in session callback:', error);
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If url is a relative path, resolve it against baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Otherwise, redirect to baseUrl
      return baseUrl;
    },
  }
}; 
