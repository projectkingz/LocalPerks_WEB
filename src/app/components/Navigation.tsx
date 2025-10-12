'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Star, 
  LogOut, 
  Menu, 
  X, 
  Clock, 
  Shield, 
  Award, 
  Gift, 
  FileText, 
  Settings,
  BarChart3,
  UserCheck,
  CreditCard,
  ChevronDown
} from 'lucide-react';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
    };

    if (isAdminDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdminDropdownOpen]);

  // Check if user is a partner (should access partner routes)
  const isPartner = session?.user?.role === 'PARTNER';
  
  // Check if user is a customer (should access customer routes)
  const isCustomer = session?.user?.role === 'CUSTOMER';

  // Check if user is an admin (should access admin routes)
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  // Debug logging
  console.log('Navigation Debug:', {
    userEmail: session?.user?.email,
    userRole: session?.user?.role,
    isPartner,
    isCustomer,
    isAdmin,
    pathname
  });

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Check if user is super admin
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  // Admin dropdown items
  const adminDropdownItems = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    ...(isSuperAdmin ? [{ name: 'System Config', href: '/admin/system-config', icon: Settings }] : []),
  ];

  // Other admin navigation items
  const adminNavItems = [
    { name: 'Rewards', href: '/admin/rewards', icon: Award },
    { name: 'Redemptions', href: '/admin/redemptions', icon: Gift },
    { name: 'Vouchers', href: '/admin/vouchers', icon: CreditCard },
    { name: 'Customers', href: '/admin/customers', icon: UserCheck },
    { name: 'Pending Transactions', href: '/admin/pending-transactions', icon: Clock },
  ];
  
  const isAdminActive = pathname === '/admin' || pathname === '/admin/system-config';

  return (
    <nav className="bg-white shadow mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Star className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-800">LocalPerks</span>
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {isAdmin ? (
                <>
                  {/* Admin Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                      className={`inline-flex items-center px-1 pt-1 pb-1 border-b-2 text-sm font-medium h-16 ${
                        isAdminActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Admin
                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isAdminDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isAdminDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        {adminDropdownItems.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsAdminDropdownOpen(false)}
                              className={`flex items-center px-4 py-2 text-sm hover:bg-gray-50 ${
                                isActive(item.href) ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                            >
                              <IconComponent className="h-4 w-4 mr-2" />
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {adminNavItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                          isActive(item.href)
                            ? 'border-blue-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mr-1" />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              ) : isPartner ? (
                <>
                  <Link
                    href="/partner/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/partner/dashboard')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/partner/rewards"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/partner/rewards')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Manage Rewards
                  </Link>
                  <Link
                    href="/partner/transactions"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/partner/transactions')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Transactions
                  </Link>
                  <Link
                    href="/partner/pending-approvals"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/partner/pending-approvals')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Pending Approvals
                  </Link>
                </>
              ) : isCustomer ? (
                <>
                  <Link
                    href="/customer/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/customer/dashboard')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/customer/rewards"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/customer/rewards')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Rewards
                  </Link>
                  <Link
                    href="/customer/voucher"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/customer/voucher')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Gift className="h-4 w-4 mr-1" />
                    Vouchers
                  </Link>
                  <Link
                    href="/customer/transactions"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/customer/transactions')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Points History
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {!isAdmin && (
              <Link
                href={isPartner ? "/partner/profile" : "/customer/profile"}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive(isPartner ? '/partner/profile' : '/customer/profile')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Profile
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {isAdmin ? (
              <>
                {adminNavItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                        isActive(item.href)
                          ? 'border-blue-500 text-blue-700 bg-blue-50'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                      }`}
                    >
                      <IconComponent className="h-4 w-4 mr-2 inline" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            ) : isPartner ? (
              <>
                <Link
                  href="/partner/dashboard"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/partner/dashboard')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/partner/rewards"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/partner/rewards')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Manage Rewards
                </Link>
                <Link
                  href="/partner/transactions"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/partner/transactions')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Transactions
                </Link>
                <Link
                  href="/partner/pending-approvals"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/partner/pending-approvals')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2 inline" />
                  Pending Approvals
                </Link>
              </>
            ) : isCustomer ? (
              <>
                <Link
                  href="/customer/dashboard"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/customer/dashboard')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/customer/rewards"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/customer/rewards')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Rewards
                </Link>
                <Link
                  href="/customer/voucher"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/customer/voucher')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <Gift className="h-4 w-4 mr-2 inline" />
                  Vouchers
                </Link>
                <Link
                  href="/customer/transactions"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/customer/transactions')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Points History
                </Link>
              </>
            ) : null}
            <Link
              href={isAdmin ? "/admin" : isPartner ? "/partner/profile" : "/customer/profile"}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive(isAdmin ? '/admin' : isPartner ? '/partner/profile' : '/customer/profile')
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {isAdmin ? 'Admin' : isPartner ? 'Profile' : 'Profile'}
            </Link>
            <button
              onClick={handleSignOut}
              className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-1 inline" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
} 