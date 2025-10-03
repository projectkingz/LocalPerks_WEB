'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '../components/Navigation';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Check if user is a partner (PARTNER only)
      const isPartner = session.user.role === 'PARTNER';
      
      // Check if user is a customer (CUSTOMER only)
      const isCustomer = session.user.role === 'CUSTOMER';
      
      // Redirect based on user role
      if (isPartner) {
        router.push('/partner/dashboard');
      } else if (isCustomer) {
        router.push('/customer/dashboard');
      }
    }
  }, [status, router, session]);

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