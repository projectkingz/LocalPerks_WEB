import { DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenantId: string;
      suspended: boolean;
    }
  }

  interface User extends DefaultUser {
    role: string;
    tenantId: string;
    suspended: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    tenantId: string;
    suspended: boolean;
  }
} 