'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, Users, DollarSign } from 'lucide-react';

interface SubscriptionData {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  tenant: {
    id: string;
    name: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    nextBillingDate: string;
  };
  subscriptions: {
    id: string;
    status: string;
    amount: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
    tier: {
      displayName: string;
      price: number;
    };
  }[];
  payments: {
    id: string;
    amount: number;
    status: string;
    paidAt: string;
    createdAt: string;
  }[];
}

interface MonthlyStatus {
  month: string;
  year: number;
  status: 'paid' | 'due' | 'overdue' | 'not_registered';
  amount?: number;
  date?: string;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } else {
        setError('Failed to fetch subscriptions');
      }
    } catch (err) {
      setError('Error fetching subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyStatus = (subscription: SubscriptionData): MonthlyStatus[] => {
    const months: MonthlyStatus[] = [];
    const currentDate = new Date();
    
    // Generate 12 months rolling from 11 months ago to current month
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const year = monthDate.getFullYear();
      
      const userSignupDate = subscription.user?.createdAt ? new Date(subscription.user.createdAt) : new Date();
      const isBeforeSignup = monthDate < new Date(userSignupDate.getFullYear(), userSignupDate.getMonth(), 1);
      
      if (isBeforeSignup) {
        months.push({
          month: monthStr,
          year,
          status: 'not_registered'
        });
        continue;
      }

      // Check if partner is still active
      if (subscription.tenant?.subscriptionStatus !== 'ACTIVE') {
        months.push({
          month: monthStr,
          year,
          status: 'not_registered'
        });
        continue;
      }

      // Find payment for this month
      const monthStart = new Date(year, monthDate.getMonth(), 1);
      const monthEnd = new Date(year, monthDate.getMonth() + 1, 0);
      
      const paymentForMonth = subscription.payments.find(payment => {
        const paymentDate = new Date(payment.paidAt);
        return paymentDate >= monthStart && paymentDate <= monthEnd && payment.status === 'COMPLETED';
      });

      if (paymentForMonth) {
        months.push({
          month: monthStr,
          year,
          status: 'paid',
          amount: paymentForMonth.amount,
          date: paymentForMonth.paidAt
        });
        continue;
      }

      // Check if payment is due or overdue
      const nextBillingDate = new Date(subscription.tenant.nextBillingDate);
      const isCurrentMonth = monthDate.getMonth() === currentDate.getMonth() && 
                           monthDate.getFullYear() === currentDate.getFullYear();
      
      if (isCurrentMonth) {
        if (currentDate < nextBillingDate) {
          months.push({
            month: monthStr,
            year,
            status: 'due',
            amount: subscription.subscriptions[0]?.tier.price || 0
          });
        } else {
          months.push({
            month: monthStr,
            year,
            status: 'overdue',
            amount: subscription.subscriptions[0]?.tier.price || 0
          });
        }
      } else {
        months.push({
          month: monthStr,
          year,
          status: 'not_registered'
        });
      }
    }

    return months;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'due':
        return 'bg-orange-100 text-orange-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'P';
      case 'due':
        return 'Due';
      case 'overdue':
        return 'O/S';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-6">
            <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Partners</p>
                  <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subscriptions.filter(s => s.tenant?.subscriptionStatus === 'ACTIVE').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    £{subscriptions
                      .filter(s => s.tenant?.subscriptionStatus === 'ACTIVE')
                      .reduce((sum, s) => sum + (s.subscriptions[0]?.tier?.price || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">12-Month Subscription Calendar</h2>
            <p className="text-sm text-gray-600">Track partner subscription payments and status</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  {getMonthlyStatus(subscriptions[0] || {} as SubscriptionData).map((month, index) => (
                    <th key={index} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {month.month} {month.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => {
                  const monthlyStatuses = getMonthlyStatus(subscription);
                  return (
                    <tr key={subscription.user?.id || 'unknown'} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.tenant?.name || 'No tenant name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.user?.email || 'No email'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Joined: {subscription.user?.createdAt ? new Date(subscription.user.createdAt).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {subscription.tenant?.subscriptionTier || 'Unknown'}
                        </span>
                      </td>
                      {monthlyStatuses.map((status, index) => (
                        <td key={index} className="px-3 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status.status)}`}>
                              {getStatusText(status.status)}
                            </span>
                            {status.amount && (
                              <span className="text-xs text-gray-500">
                                £{status.amount}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 bg-red-50 border border-red-200 rounded-md p-4"
          >
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}




