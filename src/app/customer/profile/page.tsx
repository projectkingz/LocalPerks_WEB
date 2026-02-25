'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Settings, Edit } from 'lucide-react';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import PostSignupQuestions from '@/components/PostSignupQuestions';

interface PointsData {
  points: number;
  tier: string;
}

interface OptionalQuestionsData {
  postcodeOutward: string | null;
  postcodeInward: string | null;
  yearOfBirth: number | null;
  rewardPreference: string | null;
  homeOwner: boolean | null;
  carOwner: boolean | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [pointsData, setPointsData] = useState<PointsData>({ points: 0, tier: 'Standard' });
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [optionalQuestions, setOptionalQuestions] = useState<OptionalQuestionsData | null>(null);
  const [showOptionalQuestions, setShowOptionalQuestions] = useState(false);
  const [showEditQuestions, setShowEditQuestions] = useState(false);

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
        setCustomerId(qrData.customerId || '');

        // Fetch optional questions
        try {
          const questionsResponse = await fetch('/api/customer/post-signup-questions');
          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            setOptionalQuestions(questionsData);
          }
        } catch (error) {
          console.error('Error fetching optional questions:', error);
        }
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

      {/* QR Code Digital Card */}
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <div className="text-center">
          <h2 className="text-heading font-bold text-gray-900 mb-6">Your Digital Card</h2>
          
          {loading ? (
            <div className="animate-pulse flex justify-center">
              <div className="aspect-[85.6/53.98] w-full max-w-md bg-gray-200 rounded-2xl"></div>
            </div>
          ) : (
            <div className="flex justify-center">
              {/* Digital Card - Bank Card Style */}
              <div 
                onClick={() => setShowCardModal(true)}
                className="relative w-full max-w-md bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200" 
                style={{ minHeight: '500px' }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
                
                {/* Card Content */}
                <div className="relative h-full p-6 flex flex-col justify-between">
                  {/* Top Section */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-[18px] font-medium text-white mb-1" style={{ fontFamily: 'var(--font-roboto)' }}>LocalPerks</h3>
                      <p className="text-blue-200 text-[18px] font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Loyalty Card</p>
                    </div>
                    {/* Chip */}
                    <div className="w-10 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md shadow-lg flex-shrink-0"></div>
                  </div>
                  
                  {/* Middle Section - QR Code */}
                  <div className="flex justify-center my-2 flex-shrink-0">
                    <div className="bg-white rounded-xl p-4 shadow-xl w-[232px] h-[232px] flex items-center justify-center">
                      <QRCodeSVG 
                        value={qrCode || `rewards-${session?.user?.email || 'guest'}-app`} 
                        size={200} 
                        level="H"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="space-y-2 mt-2">
                    {/* Customer Name - Aligned */}
                    <div className="min-h-[28px] flex items-center">
                      <p className="text-white text-[18px] font-medium tracking-wider" style={{ fontFamily: 'var(--font-roboto)' }}>
                        {session?.user?.name || 'Member'}
                      </p>
                    </div>
                    
                    {/* Customer ID - Aligned */}
                    <div className="min-h-[28px] flex items-center">
                      {customerId ? (
                        <div className="flex items-center space-x-2">
                          <p className="text-blue-200 text-[18px] font-medium uppercase" style={{ fontFamily: 'var(--font-roboto)' }}>ID:</p>
                          <p className="text-white text-[18px] font-medium break-all uppercase" style={{ fontFamily: 'var(--font-roboto)' }}>{customerId}</p>
                        </div>
                      ) : (
                        <div className="h-[28px]"></div>
                      )}
                    </div>
                    
                    {/* Points and Tier - Aligned */}
                    <div className="flex flex-wrap items-start justify-between gap-4 pt-2 border-t border-blue-500 border-opacity-30 min-h-[60px]">
                      <div className="min-w-[140px]">
                        <p className="text-blue-200 text-[18px] tracking-wide font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Points</p>
                        <p className="text-white text-[18px] font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>{pointsData.points.toLocaleString()}</p>
                      </div>
                      <div className="text-right min-w-[140px]">
                        <p className="text-blue-200 text-[18px] tracking-wide font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Tier</p>
                        <p className="text-white text-[18px] font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>{pointsData.tier}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <p className="mt-6 text-sm text-gray-600">
            Show this digital card to earn points at participating retailers & businesses
          </p>
        </div>
      </div>

      {/* Digital Card Modal */}
      <AnimatePresence>
        {showCardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCardModal(false)}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm my-8 flex-shrink-0"
            >
              {/* Enlarged Digital Card - compact, all details visible */}
              <div className="relative w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16 pointer-events-none"></div>
                
                {/* Card Content */}
                <div className="relative p-4 flex flex-col gap-2">
                  {/* Top Section */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium text-white" style={{ fontFamily: 'var(--font-roboto)' }}>LocalPerks</h3>
                      <p className="text-blue-200 text-sm font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Loyalty Card</p>
                    </div>
                    <div className="w-9 h-7 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded shadow-lg flex-shrink-0"></div>
                  </div>
                  
                  {/* Middle - QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white rounded-lg p-2 shadow-xl">
                      <QRCodeSVG 
                        value={qrCode || `rewards-${session?.user?.email || 'guest'}-app`} 
                        size={140}
                        level="H"
                        className="rounded"
                      />
                    </div>
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="space-y-2">
                    <p className="text-white text-sm font-medium tracking-wider break-words" style={{ fontFamily: 'var(--font-roboto)' }}>
                      {session?.user?.name || 'Member'}
                    </p>
                    {customerId && (
                      <div>
                        <p className="text-blue-200 text-xs font-medium uppercase" style={{ fontFamily: 'var(--font-roboto)' }}>ID</p>
                        <p className="text-white text-xs font-medium break-all uppercase" style={{ fontFamily: 'var(--font-roboto)' }}>{customerId}</p>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-4 pt-2 border-t border-blue-500 border-opacity-30">
                      <div>
                        <p className="text-blue-200 text-xs font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Points</p>
                        <p className="text-white text-base font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>{pointsData.points.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-200 text-xs font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>Tier</p>
                        <p className="text-white text-base font-medium" style={{ fontFamily: 'var(--font-roboto)' }}>{pointsData.tier}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Close hint */}
              <p className="text-white text-sm text-center mt-4 opacity-75">
                Click outside to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewards Status */}
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-heading font-bold text-gray-900 mb-6">Rewards Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-label font-bold text-blue-600 uppercase tracking-wide">Current Tier</p>
                <p className="text-heading font-bold text-gray-900">{pointsData.tier}</p>
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
                <p className="text-label font-bold text-blue-600 uppercase tracking-wide">Total Points</p>
                <p className="text-heading font-bold text-gray-900">{pointsData.points}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Questions */}
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading font-bold text-gray-900">Optional Questions</h2>
          <button
            onClick={() => setShowOptionalQuestions(!showOptionalQuestions)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {showOptionalQuestions ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showOptionalQuestions && optionalQuestions && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {optionalQuestions.postcodeOutward && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                  <p className="text-label font-bold text-gray-600 uppercase tracking-wide mb-2">Postcode Outward</p>
                  <p className="text-heading font-bold text-gray-900">{optionalQuestions.postcodeOutward}</p>
                </div>
              )}
              
              {optionalQuestions.yearOfBirth && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                  <p className="text-label font-bold text-gray-600 uppercase tracking-wide mb-2">Year of Birth</p>
                  <p className="text-heading font-bold text-gray-900">{optionalQuestions.yearOfBirth}</p>
                </div>
              )}
              
              {optionalQuestions.rewardPreference && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                  <p className="text-label font-bold text-gray-600 uppercase tracking-wide mb-2">Reward Preference</p>
                  <p className="text-heading font-bold text-gray-900">{optionalQuestions.rewardPreference}</p>
                </div>
              )}
              
              {optionalQuestions.homeOwner !== null && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                  <p className="text-label font-bold text-gray-600 uppercase tracking-wide mb-2">Home Owner</p>
                  <p className="text-heading font-bold text-gray-900">{optionalQuestions.homeOwner ? 'Yes' : 'No'}</p>
                </div>
              )}
              
              {optionalQuestions.carOwner !== null && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                  <p className="text-label font-bold text-gray-600 uppercase tracking-wide mb-2">Car Owner</p>
                  <p className="text-heading font-bold text-gray-900">{optionalQuestions.carOwner ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
            
            {(!optionalQuestions.postcodeOutward && 
              !optionalQuestions.yearOfBirth && 
              !optionalQuestions.rewardPreference && 
              optionalQuestions.homeOwner === null && 
              optionalQuestions.carOwner === null) && (
              <div className="text-center py-8 text-gray-500">
                <p>No optional questions answered yet.</p>
                <p className="text-sm mt-2">Complete the post-signup questions to see your responses here.</p>
              </div>
            )}
            
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditQuestions(true)}
                className="flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Questions
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PostSignupQuestions Modal - Controlled */}
      {showEditQuestions && (
        <PostSignupQuestions
          forceVisible={true}
          onComplete={async () => {
            // Refresh the optional questions data
            try {
              const questionsResponse = await fetch('/api/customer/post-signup-questions');
              if (questionsResponse.ok) {
                const questionsData = await questionsResponse.json();
                setOptionalQuestions(questionsData);
              }
            } catch (error) {
              console.error('Error refreshing optional questions:', error);
            }
            setShowEditQuestions(false);
          }}
        />
      )}
    </div>
  );
} 