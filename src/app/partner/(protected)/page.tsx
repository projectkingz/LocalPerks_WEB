'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, Users, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function PartnerDashboard() {
  const { data: session } = useSession();

  // Check if partner account is pending approval
  const isPendingApproval = session?.user?.approvalStatus === 'PENDING';

  if (isPendingApproval) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <div className="mb-6">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Account Pending Approval
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for registering as a LocalPerks partner!
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
              <h2 className="text-xl font-semibold text-yellow-800">
                Your account is currently under review
              </h2>
            </div>
            <p className="text-yellow-700 mb-4">
              Our admin team is reviewing your application. This process typically takes 1-2 business days.
            </p>
            <div className="text-sm text-yellow-600">
              <p>You'll receive an email notification once your account is approved.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <p className="text-blue-700 text-sm">
                Once approved, you'll have full access to your partner dashboard and can start creating rewards for your customers.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">Customer Benefits</h3>
              <p className="text-green-700 text-sm">
                Your customers will be able to earn points, redeem rewards, and build loyalty with your business.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 mb-2">Business Growth</h3>
              <p className="text-purple-700 text-sm">
                Access analytics, customer insights, and tools to grow your business through customer loyalty.
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-gray-500 text-sm">
              Have questions? Contact our support team at{' '}
              <a href="mailto:support@localperks.com" className="text-blue-600 hover:text-blue-700">
                support@localperks.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Regular partner dashboard for approved accounts
  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {session?.user?.name || 'Partner'}!
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Account Active</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Rewards</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Points Issued</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/partner/rewards/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Award className="h-5 w-5 text-blue-600 mr-3" />
              <span className="font-medium text-gray-900">Create Reward</span>
            </Link>
            <Link
              href="/partner/transactions"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
              <span className="font-medium text-gray-900">View Transactions</span>
            </Link>
            <Link
              href="/partner/pending-approvals"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
            >
              <Clock className="h-5 w-5 text-yellow-600 mr-3" />
              <span className="font-medium text-gray-900">Pending Approvals</span>
            </Link>
            <Link
              href="/partner/profile"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <Users className="h-5 w-5 text-purple-600 mr-3" />
              <span className="font-medium text-gray-900">Profile Settings</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 