'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface PostSignupQuestionsProps {
  onComplete?: () => void;
  forceVisible?: boolean;
}

interface QuestionData {
  postcodeOutward: string;
  postcodeInward: string;
  yearOfBirth: string;
  rewardPreference: string;
  homeOwner: string;
  carOwner: string;
}

const REWARD_PREFERENCES = [
  'Money off',
  'Free items',
  'Exclusive local events',
  'Surprise gifts'
];

export default function PostSignupQuestions({ onComplete, forceVisible = false }: PostSignupQuestionsProps) {
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(forceVisible);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<QuestionData>({
    postcodeOutward: '',
    postcodeInward: '',
    yearOfBirth: '',
    rewardPreference: '',
    homeOwner: '',
    carOwner: ''
  });
  const [errors, setErrors] = useState<Partial<QuestionData>>({});

  useEffect(() => {
    const checkAndLoadQuestions = async () => {
      // Wait for session to be authenticated
      if (status === 'loading') {
        return;
      }

      if (status !== 'authenticated' || !session?.user?.email) {
        console.log('PostSignupQuestions: No session or not authenticated', { status, hasSession: !!session });
        setLoading(false);
        return;
      }

      // Only show for customers
      if (session.user.role !== 'CUSTOMER') {
        console.log('PostSignupQuestions: Not a customer, role:', session.user.role);
        setLoading(false);
        return;
      }

      console.log('PostSignupQuestions: Checking questions for customer:', session.user.email);

      try {
        const response = await fetch('/api/customer/post-signup-questions');
        
        if (response.status === 404) {
          // Customer doesn't exist yet, show questions anyway
          console.log('PostSignupQuestions: Customer not found, showing questions');
          setIsVisible(true);
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          console.log('PostSignupQuestions: Received data:', data);
          
          // Load existing answers (always load if forceVisible or if not all answered)
          const allAnswered = 
            data.postcodeOutward && 
            data.yearOfBirth && 
            data.rewardPreference && 
            data.homeOwner !== null && 
            data.carOwner !== null;

          console.log('PostSignupQuestions: All answered?', allAnswered);

          // Load existing answers into form
          setFormData({
            postcodeOutward: data.postcodeOutward || '',
            postcodeInward: data.postcodeInward || '',
            yearOfBirth: data.yearOfBirth?.toString() || '',
            rewardPreference: data.rewardPreference || '',
            homeOwner: data.homeOwner === true ? 'Yes' : data.homeOwner === false ? 'No' : '',
            carOwner: data.carOwner === true ? 'Yes' : data.carOwner === false ? 'No' : ''
          });

          // Show if forceVisible or if not all answered
          if (forceVisible || !allAnswered) {
            setIsVisible(true);
            console.log('PostSignupQuestions: Setting visible to true');
          } else {
            console.log('PostSignupQuestions: All questions already answered, not showing');
          }
        } else {
          // If there's an error, still show the questions
          const errorText = await response.text();
          console.log('PostSignupQuestions: Error response:', response.status, errorText);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('PostSignupQuestions: Error loading post-signup questions:', error);
        // On error, still show the questions
        setIsVisible(true);
      } finally {
        setLoading(false);
      }
    };

    // Only run the check if not forceVisible (forceVisible means we already set isVisible)
    if (!forceVisible) {
      checkAndLoadQuestions();
    } else {
      // If forceVisible, just load the data
      const loadData = async () => {
        try {
          const response = await fetch('/api/customer/post-signup-questions');
          if (response.ok) {
            const data = await response.json();
            setFormData({
              postcodeOutward: data.postcodeOutward || '',
              postcodeInward: data.postcodeInward || '',
              yearOfBirth: data.yearOfBirth?.toString() || '',
              rewardPreference: data.rewardPreference || '',
              homeOwner: data.homeOwner === true ? 'Yes' : data.homeOwner === false ? 'No' : '',
              carOwner: data.carOwner === true ? 'Yes' : data.carOwner === false ? 'No' : ''
            });
          }
        } catch (error) {
          console.error('Error loading questions data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [session, status, forceVisible]);

  const handleChange = (field: keyof QuestionData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<QuestionData> = {};

    if (!formData.postcodeOutward.trim()) {
      newErrors.postcodeOutward = 'Outward code is required';
    }
    // postcodeInward is optional - no validation needed
    if (!formData.yearOfBirth.trim()) {
      newErrors.yearOfBirth = 'Year of birth is required';
    } else {
      const year = parseInt(formData.yearOfBirth);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        newErrors.yearOfBirth = 'Please enter a valid year';
      }
    }
    if (!formData.rewardPreference) {
      newErrors.rewardPreference = 'Please select a reward preference';
    }
    if (!formData.homeOwner) {
      newErrors.homeOwner = 'Please select an option';
    }
    if (!formData.carOwner) {
      newErrors.carOwner = 'Please select an option';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/customer/post-signup-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postcodeOutward: formData.postcodeOutward.trim(),
          postcodeInward: formData.postcodeInward.trim() || null,
          yearOfBirth: parseInt(formData.yearOfBirth),
          rewardPreference: formData.rewardPreference,
          homeOwner: formData.homeOwner === 'Yes',
          carOwner: formData.carOwner === 'Yes'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save answers');
      }

      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving post-signup questions:', error);
      alert('Failed to save answers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Don't render until we've checked the session
  if (loading) {
    return null;
  }

  // Only render if visible and session exists
  if (!isVisible || !session?.user) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border-2 border-gray-100"
          >
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-10 py-6 flex items-center justify-between rounded-t-3xl z-10 shadow-sm">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                Complete Your Profile
              </h2>
              <button
                onClick={() => {
                  setIsVisible(false);
                  if (forceVisible && onComplete) {
                    onComplete();
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                aria-label="Close"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="p-10 md:p-12 space-y-8">
              <p className="text-xl md:text-2xl text-gray-600 font-medium">
                Help us personalize your experience by answering a few questions. <span className="text-gray-500">(All questions are optional)</span>
              </p>

              {/* Postcode */}
              <div>
                <label className="inline-block text-4xl font-bold text-gray-900 mb-4 px-6 py-3 bg-blue-50 rounded-2xl shadow-xl border border-blue-100">
                  Postcode ?
                </label>
                <div className="grid grid-cols-2 gap-6">
                  <div className="relative group">
                    <input
                      type="text"
                      value={formData.postcodeOutward}
                      onChange={(e) => handleChange('postcodeOutward', e.target.value.toUpperCase())}
                      placeholder=" "
                      maxLength={4}
                      className={`block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                        errors.postcodeOutward ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                      Outward (e.g., SW1A)
                    </label>
                    {errors.postcodeOutward && (
                      <p className="mt-2 text-lg text-red-600 font-medium">{errors.postcodeOutward}</p>
                    )}
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      value=""
                      placeholder="Inward e.g., 1AA"
                      maxLength={3}
                      disabled
                      className="block w-full px-8 py-8 text-2xl text-center text-gray-400 bg-gray-100 border-2 rounded-3xl appearance-none transition-all duration-200 cursor-not-allowed min-h-[80px] border-gray-300 opacity-60 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Year of Birth */}
              <div>
                <label htmlFor="yearOfBirth" className="inline-block text-4xl font-bold text-gray-900 mb-4 px-6 py-3 bg-blue-50 rounded-2xl shadow-xl border border-blue-100">
                  Year of Birth ?
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    id="yearOfBirth"
                    value={formData.yearOfBirth}
                    onChange={(e) => handleChange('yearOfBirth', e.target.value)}
                    placeholder="e.g 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    className={`block w-full px-8 py-8 text-2xl text-gray-900 bg-gray-50 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                      errors.yearOfBirth ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.yearOfBirth && (
                    <p className="mt-2 text-lg text-red-600 font-medium">{errors.yearOfBirth}</p>
                  )}
                </div>
              </div>

              {/* Reward Preference */}
              <div>
                <label className="inline-block text-4xl font-bold text-gray-900 mb-4 px-6 py-3 bg-blue-50 rounded-2xl shadow-xl border border-blue-100">
                  Reward Preference ?
                </label>
                <div className="grid grid-cols-2 gap-6">
                  {REWARD_PREFERENCES.map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => handleChange('rewardPreference', pref)}
                      className={`relative px-8 py-8 border-2 rounded-3xl text-2xl font-bold transition-all min-h-[80px] shadow-lg hover:shadow-xl ${
                        formData.rewardPreference === pref
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      {pref}
                      {formData.rewardPreference === pref && (
                        <Check className="absolute bottom-3 right-3 w-8 h-8 text-white" strokeWidth={4} />
                      )}
                    </button>
                  ))}
                </div>
                {errors.rewardPreference && (
                  <p className="mt-2 text-lg text-red-600 font-medium">{errors.rewardPreference}</p>
                )}
              </div>

              {/* Home Owner */}
              <div>
                <label className="inline-block text-4xl font-bold text-gray-900 mb-4 px-6 py-3 bg-blue-50 rounded-2xl shadow-xl border border-blue-100">
                  Home Owner ?
                </label>
                <div className="grid grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => handleChange('homeOwner', 'Yes')}
                    className={`relative px-8 py-8 border-2 rounded-3xl text-2xl font-bold transition-all min-h-[80px] shadow-lg hover:shadow-xl ${
                      formData.homeOwner === 'Yes'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    Yes
                    {formData.homeOwner === 'Yes' && (
                      <Check className="absolute bottom-3 right-3 w-8 h-8 text-white" strokeWidth={4} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('homeOwner', 'No')}
                    className={`relative px-8 py-8 border-2 rounded-3xl text-2xl font-bold transition-all min-h-[80px] shadow-lg hover:shadow-xl ${
                      formData.homeOwner === 'No'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    No
                    {formData.homeOwner === 'No' && (
                      <Check className="absolute bottom-3 right-3 w-8 h-8 text-white" strokeWidth={4} />
                    )}
                  </button>
                </div>
                {errors.homeOwner && (
                  <p className="mt-2 text-lg text-red-600 font-medium">{errors.homeOwner}</p>
                )}
              </div>

              {/* Car Owner */}
              <div>
                <label className="inline-block text-4xl font-bold text-gray-900 mb-4 px-6 py-3 bg-blue-50 rounded-2xl shadow-xl border border-blue-100">
                  Car Owner ?
                </label>
                <div className="grid grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => handleChange('carOwner', 'Yes')}
                    className={`relative px-8 py-8 border-2 rounded-3xl text-2xl font-bold transition-all min-h-[80px] shadow-lg hover:shadow-xl ${
                      formData.carOwner === 'Yes'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    Yes
                    {formData.carOwner === 'Yes' && (
                      <Check className="absolute bottom-3 right-3 w-8 h-8 text-white" strokeWidth={4} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('carOwner', 'No')}
                    className={`relative px-8 py-8 border-2 rounded-3xl text-2xl font-bold transition-all min-h-[80px] shadow-lg hover:shadow-xl ${
                      formData.carOwner === 'No'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    No
                    {formData.carOwner === 'No' && (
                      <Check className="absolute bottom-3 right-3 w-8 h-8 text-white" strokeWidth={4} />
                    )}
                  </button>
                </div>
                {errors.carOwner && (
                  <p className="mt-2 text-lg text-red-600 font-medium">{errors.carOwner}</p>
                )}
              </div>

              <div className="flex gap-6 pt-6">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  className={`flex-1 py-8 px-8 rounded-3xl text-2xl font-bold text-white transition-all min-h-[80px] shadow-xl hover:shadow-2xl ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save & Continue'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsVisible(false);
                    if (forceVisible && onComplete) {
                      onComplete();
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-8 rounded-3xl text-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all min-h-[80px] shadow-lg hover:shadow-xl"
                >
                  Skip for Now
                </motion.button>
              </div>
            </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
