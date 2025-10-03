'use client';
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '../../components/Navigation';

export default function PartnerProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?type=partner');
    } else if (status === 'authenticated') {
      // Check if user is a partner (PARTNER only)
      const isPartner = session?.user?.role === 'PARTNER';
      
      console.log('Partner layout - User role:', session?.user?.role, 'isPartner:', isPartner);
      
      // If user is NOT a partner, redirect to customer dashboard
      if (!isPartner) {
        console.log('Partner layout - Redirecting to customer dashboard');
        router.push('/customer/dashboard');
      } else {
        console.log('Partner layout - User is partner, staying on partner dashboard');
      }
    }
  }, [status, router, session, pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 