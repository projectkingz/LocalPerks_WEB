'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import SuspendedUserWrapper from '@/components/SuspendedUserWrapper';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SuspendedUserWrapper>
        {children}
      </SuspendedUserWrapper>
    </main>
  );
} 