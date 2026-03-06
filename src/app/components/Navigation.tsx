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
  ChevronDown,
  LayoutGrid,
  MessageCircle
} from 'lucide-react';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isManageDropdownOpen, setIsManageDropdownOpen] = useState(false);
  const [isCustomerManageDropdownOpen, setIsCustomerManageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const manageDropdownRef = useRef<HTMLDivElement>(null);
  const customerManageDropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsAdminDropdownOpen(false);
      }
      if (manageDropdownRef.current && !manageDropdownRef.current.contains(target)) {
        setIsManageDropdownOpen(false);
      }
      if (customerManageDropdownRef.current && !customerManageDropdownRef.current.contains(target)) {
        setIsCustomerManageDropdownOpen(false);
      }
    };

    if (isAdminDropdownOpen || isManageDropdownOpen || isCustomerManageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdminDropdownOpen, isManageDropdownOpen, isCustomerManageDropdownOpen]);

  // Check if user is a partner (should access partner routes)
  const isPartner = session?.user?.role === 'PARTNER';
  
  // Check if user is a customer (should access customer routes)
  const isCustomer = session?.user?.role === 'CUSTOMER';

  // Check if user is an admin (should access admin routes)
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!session?.user) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread-count');
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.count === 'number') {
          setUnreadCount(data.count);
        }
      } catch {
        // ignore
      }
    };

    fetchUnread();
  }, [session?.user, pathname]);

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

  // Manage dropdown items (Rewards, Vouchers, Pending Transactions)
  const manageDropdownItems = [
    { name: 'Rewards', href: '/admin/rewards', icon: Award },
    { name: 'Vouchers', href: '/admin/vouchers', icon: CreditCard },
    { name: 'Pending Transactions', href: '/admin/pending-transactions', icon: Clock },
  ];

  // Other admin navigation items (direct links)
  const adminNavItems = [
    { name: 'Customers', href: '/admin/customers', icon: UserCheck },
  ];
  
  const isAdminActive = pathname === '/admin' || pathname === '/admin/system-config';
  const isManageActive = pathname === '/admin/rewards' || pathname === '/admin/vouchers' || pathname === '/admin/pending-transactions';
  const isCustomerManageActive = pathname === '/customer/rewards' || pathname === '/customer/vouchers';

  // Customer Manage dropdown items (Rewards, Vouchers)
  const customerManageDropdownItems = [
    { name: 'Rewards', href: '/customer/rewards', icon: Award },
    { name: 'Vouchers', href: '/customer/vouchers', icon: Gift },
  ];

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

                  {/* Manage dropdown (Rewards + Vouchers) */}
                  <div className="relative" ref={manageDropdownRef}>
                    <button
                      onClick={() => setIsManageDropdownOpen(!isManageDropdownOpen)}
                      className={`inline-flex items-center px-1 pt-1 pb-1 border-b-2 text-sm font-medium h-16 ${
                        isManageActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4 mr-1" />
                      Manage
                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isManageDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isManageDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        {manageDropdownItems.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsManageDropdownOpen(false)}
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
                    href="/partner/vouchers"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/partner/vouchers')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Manage Vouchers
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
                  {/* Manage dropdown (Rewards + Vouchers) */}
                  <div className="relative" ref={customerManageDropdownRef}>
                    <button
                      onClick={() => setIsCustomerManageDropdownOpen(!isCustomerManageDropdownOpen)}
                      className={`inline-flex items-center px-1 pt-1 pb-1 border-b-2 text-sm font-medium h-16 ${
                        isCustomerManageActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4 mr-1" />
                      Manage
                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isCustomerManageDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCustomerManageDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        {customerManageDropdownItems.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsCustomerManageDropdownOpen(false)}
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
            <Link
              href={isAdmin ? "/admin/messages" : "/messages"}
              className={`relative inline-flex items-center px-1 pt-1 pb-1 border-b-2 text-sm font-medium h-16 ${
                (isAdmin ? pathname === '/admin/messages' : pathname === '/messages')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Messages
              {unreadCount > 0 && (
                <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
            <Link
              href={isAdmin ? "/admin/profile" : isPartner ? "/partner/profile" : "/customer/profile"}
              className={`inline-flex items-center px-1 pt-1 pb-1 border-b-2 text-sm font-medium h-16 ${
                isActive(isAdmin ? '/admin/profile' : isPartner ? '/partner/profile' : '/customer/profile')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Profile
            </Link>
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
                {adminDropdownItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
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
                <div className="pl-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manage</div>
                {manageDropdownItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block pl-6 pr-4 py-2 border-l-4 text-base font-medium ${
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
                {adminNavItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
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
                  href="/partner/vouchers"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/partner/vouchers')
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Manage Vouchers
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
                <div className="pl-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manage</div>
                {customerManageDropdownItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block pl-6 pr-4 py-2 border-l-4 text-base font-medium ${
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
              href={isAdmin ? "/admin/messages" : "/messages"}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                (isAdmin ? pathname === '/admin/messages' : pathname === '/messages')
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              Messages
            </Link>
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