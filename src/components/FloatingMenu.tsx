'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

const FloatingMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Profile',
      action: () => router.push('/customer/profile')
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      label: 'Scan Receipt',
      action: () => router.push('/scan')
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Points',
      action: () => router.push('/customer/transactions')
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu Items */}
      <div className={`flex flex-col-reverse gap-3 mb-4 transition-all duration-300 ease-in-out transform ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.action();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transform transition-all duration-200 hover:scale-105"
          >
            <span className="text-blue-600">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110 ${isOpen ? 'rotate-45' : ''}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingMenu; 