'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Lock, Settings } from 'lucide-react';
import PasswordChangeForm from '@/components/PasswordChangeForm';

interface PointsData {
  points: number;
  tier: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [pointsData, setPointsData] = useState<PointsData>({ points: 0, tier: 'Standard' });
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch points data
        const pointsResponse = await fetch('/api/points');
        const pointsData = await pointsResponse.json();
        setPointsData(pointsData);

        // Fetch QR code
        const qrResponse = await fetch('/api/customer/qr');
        const qrData = await qrResponse.json();
        setQrCode(qrData.qrCode);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchData();
    }
  }, [session?.user?.email]);

  const handlePasswordSuccess = () => {
    setShowPasswordForm(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      {/* Profile Information */}
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{session?.user?.name}</h2>
            <p className="text-gray-600 mt-1">{session?.user?.email}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {pointsData.tier} Member
            </span>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 text-blue-600 mr-2" />
            Account Settings
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Lock className="h-4 w-4 mr-2" />
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>
        </div>

        {showPasswordForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <PasswordChangeForm
              onSuccess={handlePasswordSuccess}
              onCancel={() => setShowPasswordForm(false)}
            />
          </motion.div>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your QR Code</h2>
          <p className="text-sm text-gray-600 mb-4">Scan this code to earn points</p>
          {loading ? (
            <div className="animate-pulse flex justify-center">
              <div className="h-80 w-80 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="p-6 bg-white rounded-lg shadow-inner">
                <QRCodeSVG value={qrCode} size={300} level="H" />
              </div>
            </div>
          )}
          <p className="mt-4 text-sm text-gray-600">
            Show this code to earn points at participating retailers & businesses
          </p>
        </div>
      </div>

      {/* Rewards Status */}
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Rewards Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">Current Tier</p>
                <p className="text-2xl font-bold text-gray-900">{pointsData.tier}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">{pointsData.points}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 