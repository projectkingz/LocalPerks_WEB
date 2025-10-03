'use client';
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '../components/Navigation';
import SuspendedUserWrapper from '@/components/SuspendedUserWrapper';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?type=customer');
    } else if (status === 'authenticated') {
      // Check if user is a customer (CUSTOMER only)
      const isCustomer = session?.user?.role === 'CUSTOMER';
      
      console.log('Customer layout - User role:', session?.user?.role, 'isCustomer:', isCustomer);
      
      // If user is NOT a customer, redirect to partner dashboard
      if (!isCustomer) {
        console.log('Customer layout - Redirecting to partner dashboard');
        router.push('/partner/dashboard');
      } else {
        console.log('Customer layout - User is customer, staying on customer dashboard');
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
        <SuspendedUserWrapper>
          {children}
        </SuspendedUserWrapper>
      </main>
    </div>
  );
} 