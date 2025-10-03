'use client';

import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Rewards', href: '/rewards', current: pathname === '/rewards' },
    { name: 'Profile', href: '/profile', current: pathname === '/profile' }
  ];

  return null; // Add your navigation UI here
};

export default Navigation; 