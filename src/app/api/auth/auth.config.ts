import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { hasPending2FAVerification } from '@/lib/auth/two-factor';
import { Prisma } from '@prisma/client';

interface UserWithPassword {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string | null;
  password: string | null;
  suspended: boolean;
  approvalStatus: string;
}

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
        console.log('Starting authorization...');
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          console.log('Finding user:', credentials.email);
          // Use raw query to get user with password
          const users = await prisma.$queryRaw<UserWithPassword[]>`
            SELECT id, email, name, role, tenantId, password, suspended, approvalStatus
            FROM User
            WHERE email = ${credentials.email}
            LIMIT 1
          `;

          const user = users[0];

          if (!user) {
            console.log('User not found');
            return null;
          }

          console.log('User found:', { id: user.id, email: user.email });

          // For users without a password (e.g., social login), deny credentials login
          if (!user.password) {
            console.log('User signed up with social login, cannot use email/password');
            throw new Error('SOCIAL_LOGIN_ONLY');
          }

          console.log('Verifying password...');
          const isPasswordValid = await compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            console.log('Invalid password');
            return null;
          }

          console.log('Password verified successfully');

          // Check if 2FA verification is pending
          const has2FA = await hasPending2FAVerification(user.id);
          if (has2FA) {
            console.log('2FA verification required');
            throw new Error('2FA_REQUIRED');
          }

          console.log('Authorization successful');
          console.log('User suspended status:', user.suspended, typeof user.suspended);
          
          // Return user data - suspension will be checked in signIn callback
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            suspended: Boolean(user.suspended),
            approvalStatus: user.approvalStatus,
          };
        } catch (error) {
          console.error('Error in authorize:', error);
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
      console.log('SignIn callback - user suspended status:', user.suspended, typeof user.suspended);
      console.log('SignIn callback - account provider:', account?.provider);
      console.log('SignIn callback - user email:', user.email);
      console.log('SignIn callback - approval status:', user.approvalStatus);
      
      // Check if user is suspended - handle both boolean and numeric values
      const isSuspended = Boolean(user.suspended);
      console.log('Is suspended (converted):', isSuspended);
      
      if (isSuspended) {
        console.log('Suspended user attempting to sign in:', user.email);
        console.log('Approval status for redirect:', user.approvalStatus);
        
        // Determine the specific error message based on approval status
        let errorUrl = '/auth/signin?error=';
        if (user.approvalStatus === 'UNDER_REVIEW') {
          errorUrl += 'account_under_review';
        } else if (user.approvalStatus === 'PENDING_EMAIL_VERIFICATION') {
          errorUrl += 'email_verification_required';
        } else if (user.approvalStatus === 'PENDING') {
          errorUrl += 'pending_approval';
        } else {
          errorUrl += 'suspended';
        }
        
        console.log('Redirecting to:', errorUrl);
        return errorUrl;
      }

      // For social logins, enforce authentication method consistency
      if (account?.provider !== 'credentials') {
        try {
          console.log('Processing social login for:', user.email);
          
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true }
          });

          console.log('Existing user found:', !!existingUser);
          if (existingUser) {
            console.log('Existing user accounts:', existingUser.accounts.map(acc => acc.provider));
          }

          if (existingUser) {
            // Check if user has a password (email/password signup)
            const hasPassword = existingUser.password !== null;
            
            // Check if user has any OAuth accounts
            const hasOAuthAccounts = existingUser.accounts.length > 0;
            
            // Check if they have an account with this specific provider
            const hasThisProviderAccount = existingUser.accounts.some(
              acc => acc.provider === account?.provider
            );
            
            console.log('User has password:', hasPassword);
            console.log('User has OAuth accounts:', hasOAuthAccounts);
            console.log('User has this provider account:', hasThisProviderAccount);
            
            // If user signed up with email/password, they can't use social login
            if (hasPassword && !hasOAuthAccounts) {
              console.log('User signed up with email/password, blocking social login');
              return '/auth/signin?error=email_password_only';
            }
            
            // If user signed up with a different social provider, they can't use this one
            if (hasOAuthAccounts && !hasThisProviderAccount) {
              console.log('User signed up with different social provider, blocking this provider');
              return '/auth/signin?error=wrong_social_provider';
            }
            
            // If user has this provider account, allow login
            if (hasThisProviderAccount) {
              console.log('User has this provider account, allowing login');
              return true;
            }
            
            // If user has no password and no OAuth accounts (edge case), allow linking
            if (!hasPassword && !hasOAuthAccounts && account) {
              console.log('Linking new OAuth account to existing user');
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

              // Ensure customer record exists for this user
              const existingCustomer = await prisma.customer.findUnique({
                where: { email: existingUser.email }
              });

              if (!existingCustomer) {
                console.log('Creating customer record for existing user');
                // Create a default tenant if none exists
                let defaultTenant = await prisma.tenant.findFirst({
                  where: { name: 'System Default Tenant' }
                });

                if (!defaultTenant) {
                  // Create a system user first for the tenant
                  const systemUser = await prisma.user.create({
                    data: {
                      email: 'system@default.com',
                      name: 'System User',
                      role: 'ADMIN',
                      suspended: false,
                    }
                  });

                  defaultTenant = await prisma.tenant.create({
                    data: {
                      name: 'System Default Tenant',
                      partnerUserId: systemUser.id,
                    }
                  });
                }

                // Create customer record
                await prisma.customer.create({
                  data: {
                    email: existingUser.email,
                    name: existingUser.name || '',
                    mobile: '000-000-0000', // Default mobile for social login users
                    tenantId: defaultTenant.id,
                  }
                });
              }
            }
          } else if (user.email) {
            console.log('New user will be created by NextAuth adapter');
            // Let NextAuth's PrismaAdapter handle user creation
            // We'll ensure customer record exists in the session callback
          }
        } catch (error) {
          console.error('Error during social sign in:', error);
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
      }
      if (account) {
        token.provider = account.provider;
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
        
        // Ensure customer record exists for this user
        try {
          const existingCustomer = await prisma.customer.findUnique({
            where: { email: session.user.email! }
          });

          if (!existingCustomer) {
            console.log('Creating customer record for user in session callback');
            // Create a default tenant if none exists
            let defaultTenant = await prisma.tenant.findFirst({
              where: { name: 'System Default Tenant' }
            });

            if (!defaultTenant) {
              // Create a system user first for the tenant
              const systemUser = await prisma.user.create({
                data: {
                  email: 'system@default.com',
                  name: 'System User',
                  role: 'ADMIN',
                  suspended: false,
                }
              });

              defaultTenant = await prisma.tenant.create({
                data: {
                  name: 'System Default Tenant',
                  partnerUserId: systemUser.id,
                }
              });
            }

            // Create customer record
            await prisma.customer.create({
              data: {
                email: session.user.email!,
                name: session.user.name || '',
                mobile: '000-000-0000', // Default mobile for social login users
                tenantId: defaultTenant.id,
              }
            });
          }
        } catch (error) {
          console.error('Error ensuring customer record in session callback:', error);
        }
      }
      return session;
    },
  }
}; 