"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";

// Fetch voucher from real API
const fetchVoucher = async (id: string) => {
  const res = await fetch(`/api/rewards/${id}`);
  if (!res.ok) throw new Error('Failed to fetch voucher');
  return res.json();
};

// Update voucher via real API
const updateVoucher = async (id: string, data: any) => {
  const res = await fetch(`/api/rewards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update voucher');
  return res.json();
};

export default function EditVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [voucher, setVoucher] = useState<any>(null);
  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    discountPercentage: 0,
    validFrom: "",
    validTo: "",
    maxRedemptionsPerCustomer: "" as string | number
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchVoucher(id as string)
        .then((data) => {
          setVoucher(data);
          
          // Check if voucher is approved - if so, redirect back
          if (data.approvalStatus === 'APPROVED') {
            setError("This voucher has been approved and cannot be edited. Please contact an administrator if you need to make changes.");
            setLoading(false);
            return;
          }
          
          // Format dates for input fields (YYYY-MM-DD)
          const formatDateForInput = (dateString: string | null | undefined) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          };
          setForm({
            name: data.name,
            description: data.description,
            discountPercentage: data.discountPercentage || 0,
            validFrom: formatDateForInput(data.validFrom),
            validTo: formatDateForInput(data.validTo),
            maxRedemptionsPerCustomer: data.maxRedemptionsPerCustomer ?? "",
          });
          setLoading(false);
        })
        .catch((err) => {
          setError("Voucher not found or could not be loaded.");
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent editing if voucher is approved
    if (voucher?.approvalStatus === 'APPROVED') {
      setError("This voucher has been approved and cannot be edited. Please contact an administrator if you need to make changes.");
      return;
    }
    
    setSaving(true);
    try {
      await updateVoucher(id as string, form);
      setSaving(false);
      router.push("/partner/vouchers");
    } catch (err) {
      setError("Failed to update voucher. It may have been approved.");
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  
  const isApproved = voucher?.approvalStatus === 'APPROVED';
  
  if (error && !isApproved) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50">
      <div className="max-w-xl mx-auto p-4 bg-white rounded shadow text-center">
        <div className="text-3xl mb-2">❌</div>
        <div className="text-lg font-semibold text-red-600 mb-2">{error}</div>
        <button
          onClick={() => router.push("/partner/vouchers")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Vouchers
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
      {/* Navigation Bar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-white/80 shadow-sm border-b border-blue-100 fixed top-0 left-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-pink-100 text-pink-600 text-2xl shadow">🎫</span>
          <span className="ml-2 text-xl font-bold text-blue-700 tracking-tight">MyVouchers</span>
        </div>
        <a
          href="/partner/vouchers"
          className="text-blue-600 hover:text-pink-500 font-semibold px-4 py-2 rounded transition"
        >
          ← Back to Vouchers
        </a>
      </nav>
      {/* Spacer for navbar */}
      <div className="h-20" />
      <div className="flex items-start justify-center pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-10 md:p-12 border-2 border-gray-100/50 backdrop-blur-sm my-8"
        >
            <div className="flex items-center mb-8">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 text-pink-600 text-4xl shadow mr-4">🎫</span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              {isApproved ? 'View Voucher' : 'Edit Voucher'}
            </h1>
          </div>
          
          {isApproved && (
            <div className="mb-8 rounded-2xl bg-yellow-50 p-6 border-2 border-yellow-200 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-bold text-yellow-800">Voucher Approved</h3>
                  <p className="mt-1 text-base text-yellow-700">
                    This voucher has been approved by an administrator and cannot be edited. 
                    Please contact support if you need to make changes.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {error && isApproved && (
            <div className="mb-8 rounded-2xl bg-red-50 p-6 border-2 border-red-200 shadow-md">
              <p className="text-base font-semibold text-red-800">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
              <div className="relative group">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  disabled={isApproved}
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                    isApproved 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'bg-gray-50 border-gray-200 focus:bg-white'
                  }`}
                  placeholder=" "
                />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                Name *
              </label>
            </div>
              <div className="relative group">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  disabled={isApproved}
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 peer group-hover:border-gray-300 shadow-lg hover:shadow-xl resize-none ${
                    isApproved 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'bg-gray-50 border-gray-200 focus:bg-white'
                  }`}
                  placeholder=" "
                />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-8 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                Description *
              </label>
            </div>
              <div className="relative group">
                <input
                  type="number"
                  name="discountPercentage"
                  value={form.discountPercentage}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  step="0.1"
                  required
                  disabled={isApproved}
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                    isApproved 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'bg-gray-50 border-gray-200 focus:bg-white'
                  }`}
                  placeholder=" "
                />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                Discount Percentage *
              </label>
              <p className="mt-2 text-base text-gray-500 font-medium">Enter a number between 0 and 100. This will be the percentage discount applied to purchases.</p>
            </div>
              <div className="relative group">
                <input
                  type="date"
                  name="validFrom"
                  value={form.validFrom}
                  onChange={handleChange}
                  required
                  disabled={isApproved}
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                    isApproved 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'bg-gray-50 border-gray-200 focus:bg-white'
                  }`}
                />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                Valid From *
              </label>
              <p className="mt-2 text-base text-gray-500 font-medium">The date from which this voucher becomes valid.</p>
            </div>
              <div className="relative group">
                <input
                  type="date"
                  name="validTo"
                  value={form.validTo}
                  onChange={handleChange}
                  required
                  min={form.validFrom || undefined}
                  disabled={isApproved}
                  className={`block w-full px-8 py-8 text-2xl text-gray-900 border-2 rounded-3xl appearance-none transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 peer group-hover:border-gray-300 shadow-lg hover:shadow-xl min-h-[80px] ${
                    isApproved 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'bg-gray-50 border-gray-200 focus:bg-white'
                  }`}
                />
              <label className="absolute text-xl font-medium text-gray-600 duration-200 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] bg-white px-3 peer-focus:px-3 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:bg-white group-hover:bg-white">
                Valid To *
              </label>
              <p className="mt-2 text-base text-gray-500 font-medium">The date until which this voucher is valid. After this date, the voucher will be marked as expired.</p>
            </div>
            {isApproved ? (
              <motion.button
                type="button"
                onClick={() => router.push("/partner/vouchers")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full flex justify-center items-center py-8 px-8 border border-transparent text-2xl font-bold rounded-3xl text-white shadow-xl transition-all duration-200 min-h-[80px] bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-2xl transform hover:scale-[1.02]"
              >
                <span className="text-2xl">Back to Vouchers</span>
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                disabled={saving}
                className={`group relative w-full flex justify-center items-center py-8 px-8 border border-transparent text-2xl font-bold rounded-3xl text-white shadow-xl transition-all duration-200 min-h-[80px] ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-2xl transform hover:scale-[1.02]'
                }`}
              >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-2xl">Saving...</span>
                </>
              ) : (
                <span className="text-2xl">Save Changes</span>
              )}
              </motion.button>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
