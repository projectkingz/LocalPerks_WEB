'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Download,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Award,
  PoundSterling,
  Plus,
  X,
  User,
  Check
} from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

export default function PartnerTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [displayId, setDisplayId] = useState('');
  const [amount, setAmount] = useState('');
  const [isRefund, setIsRefund] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [manualEntryError, setManualEntryError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [calculatedPoints, setCalculatedPoints] = useState<number | null>(null);

  const fetchTransactions = () => {
    setLoading(true);
    setError(null);
    fetch('/api/transactions')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
      })
      .then(data => {
        console.log('API Response:', data);
        console.log('Transactions type:', typeof data?.transactions);
        console.log('Is array:', Array.isArray(data?.transactions));
        
        // Handle different possible response structures
        let transactionsArray = [];
        if (Array.isArray(data)) {
          transactionsArray = data;
        } else if (Array.isArray(data?.transactions)) {
          transactionsArray = data.transactions;
        } else if (Array.isArray(data?.data)) {
          transactionsArray = data.data;
        } else {
          console.error('Unexpected API response structure:', data);
          transactionsArray = [];
        }
        
        setTransactions(transactionsArray);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error loading transactions');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleLookupCustomer = async () => {
    if (!displayId || displayId.length !== 6) {
      setManualEntryError('Please enter a valid 6-digit customer ID');
      return;
    }

    setLookupLoading(true);
    setManualEntryError(null);
    setCustomerInfo(null);

    try {
      const response = await fetch(`/api/customers/lookup?displayId=${encodeURIComponent(displayId.toUpperCase())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lookup customer');
      }

      if (data.success && data.customer) {
        setCustomerInfo(data.customer);
      } else {
        throw new Error('Customer not found');
      }
    } catch (err: any) {
      setManualEntryError(err.message || 'Failed to lookup customer');
      setCustomerInfo(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerInfo) {
      setManualEntryError('Please lookup customer first');
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount === 0 || (transactionAmount < 0 && !isRefund)) {
      setManualEntryError('Please enter a valid amount');
      return;
    }

    // For refunds, amount should be negative
    const finalAmount = isRefund ? -Math.abs(transactionAmount) : Math.abs(transactionAmount);

    setSubmitting(true);
    setManualEntryError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          customerId: customerInfo.id,
          type: isRefund ? 'REFUND' : 'EARNED'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      // Success - reset form and refresh transactions
      setSuccess(true);
      setDisplayId('');
      setAmount('');
      setIsRefund(false);
      setCustomerInfo(null);
      setCalculatedPoints(null);
      
      // Refresh transactions list
      setTimeout(() => {
        fetchTransactions();
        setShowManualEntry(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setManualEntryError(err.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setDisplayId('');
    setAmount('');
    setIsRefund(false);
    setCustomerInfo(null);
    setManualEntryError(null);
    setSuccess(false);
    setCalculatedPoints(null);
  };

  const getTransactionTypeInfo = (transaction: any) => {
    const type = (transaction?.type || '').toString().toUpperCase();

    switch (type) {
      case 'REFUND':
        return {
          label: 'Refund Issued',
          badgeClass: 'bg-red-100 text-red-800'
        };
      case 'SPENT':
        return {
          label: 'Reward Redemption',
          badgeClass: 'bg-blue-100 text-blue-800'
        };
      case 'EARNED':
      default:
        return {
          label: 'Purchase',
          badgeClass: 'bg-green-100 text-green-800'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions History</h1>
            <p className="mt-1 text-sm text-gray-500">View and manage your business transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Manual Entry
            </button>
            <button
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-gray-600"
            >
              <Download className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Manual Entry Floating Modal */}
        <AnimatePresence>
          {showManualEntry && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowManualEntry(false);
                  handleReset();
                }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              
              {/* Modal Card */}
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[85vh] min-h-[600px] overflow-hidden pointer-events-auto flex flex-col"
                >
                  {/* Header */}
                  <div className="relative flex items-center justify-between px-6 py-5 border-b border-blue-300/30 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                    
                    <div className="relative flex items-center gap-3 flex-1">
                      <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">Manual Transaction Entry</h2>
                        <p className="text-sm text-blue-100 mt-0.5">
                          Enter customer ID and amount when QR code scanning is unavailable
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowManualEntry(false);
                        handleReset();
                      }}
                      className="relative p-2 hover:bg-white/20 rounded-xl transition-colors text-white hover:text-white z-10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-8 text-[18px] leading-relaxed">
                    <form onSubmit={handleSubmitTransaction} className="space-y-4 text-[18px]">
                      {/* Customer ID Input */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-2">
                          Customer Display ID (6 digits)
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={displayId}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6);
                              setDisplayId(value);
                              setCustomerInfo(null);
                              setManualEntryError(null);
                            }}
                            placeholder="ABC123"
                            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase font-mono text-lg tracking-wider bg-gray-50 hover:bg-white transition-colors"
                            maxLength={6}
                            disabled={submitting || lookupLoading}
                          />
                          <button
                            type="button"
                            onClick={handleLookupCustomer}
                            disabled={!displayId || displayId.length !== 6 || lookupLoading || submitting}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-500/30"
                          >
                            {lookupLoading ? 'Looking up...' : 'Lookup'}
                          </button>
                        </div>
                      </div>

                      {/* Customer Info Display */}
                      {customerInfo && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm"
                        >
                          <div className="flex items-start">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="font-semibold text-gray-900 text-lg">{customerInfo.name}</div>
                                <Check className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="space-y-1">
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">ID:</span> <span className="font-mono font-semibold">{customerInfo.displayId}</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Email:</span> {customerInfo.email}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Current Points:</span> <span className="font-semibold text-green-600">{customerInfo.points || 0}</span>
                                </div>
                              </div>
                              {isRefund && calculatedPoints !== null && customerInfo.points !== null && (
                                <div className="mt-3 pt-3 border-t border-green-300">
                                  {customerInfo.points + calculatedPoints < 0 ? (
                                    <div className="text-sm text-red-600 font-medium">
                                      ⚠️ Warning: Customer has insufficient points for this refund. 
                                      Current: {customerInfo.points}, Required: {Math.abs(calculatedPoints)}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-600">
                                      Points after refund: <span className="font-semibold">{customerInfo.points + calculatedPoints}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Refund Toggle */}
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                        <input
                          type="checkbox"
                          id="refund-toggle"
                          checked={isRefund}
                          onChange={(e) => {
                            setIsRefund(e.target.checked);
                            setAmount('');
                            setCalculatedPoints(null);
                            setManualEntryError(null);
                          }}
                          className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded cursor-pointer"
                          disabled={submitting || !customerInfo}
                        />
                        <label htmlFor="refund-toggle" className="text-sm font-semibold text-gray-800 cursor-pointer flex items-center gap-2">
                          <span className="text-yellow-600">🔄</span>
                          Process Refund (Deduct Points)
                        </label>
                      </div>

                      {/* Amount Input */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-2">
                          {isRefund ? 'Refund Amount (£)' : 'Transaction Amount (£)'}
                        </label>
                        <div className="relative">
                          <PoundSterling className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isRefund ? 'text-red-400' : 'text-gray-400'}`} />
                          <input
                            type="number"
                            value={amount}
                            onChange={async (e) => {
                              const value = e.target.value;
                              setAmount(value);
                              setManualEntryError(null);
                              
                              // Calculate points preview if customer is found and amount is valid
                              if (customerInfo && value) {
                                const amt = parseFloat(value);
                                if (!isNaN(amt) && amt > 0) {
                                  try {
                                    // Calculate points - we'll use a simple estimate for preview
                                    // The actual calculation happens server-side using tenant config
                                    const estimatedPoints = Math.floor(amt * 5); // Default 5 points per £1
                                    setCalculatedPoints(isRefund ? -estimatedPoints : estimatedPoints);
                                  } catch (err) {
                                    setCalculatedPoints(null);
                                  }
                                } else {
                                  setCalculatedPoints(null);
                                }
                              } else {
                                setCalculatedPoints(null);
                              }
                            }}
                            placeholder={isRefund ? "Enter refund amount..." : "0.00"}
                            step="0.01"
                            min="0.01"
                            className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl text-[18px] focus:ring-2 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors ${
                              isRefund 
                                ? 'border-red-300 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            disabled={!customerInfo || submitting}
                            required
                          />
                        </div>
                        {calculatedPoints !== null && amount && customerInfo && (
                          <div className={`mt-2 p-3 border rounded-lg ${
                            isRefund 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="flex items-center gap-2 text-sm">
                              <Award className={`h-4 w-4 ${isRefund ? 'text-red-600' : 'text-blue-600'}`} />
                              <span className="text-gray-700">
                                {isRefund ? 'Points to deduct:' : 'Estimated points:'} 
                                <span className={`font-bold ${isRefund ? 'text-red-600' : 'text-blue-600'}`}>
                                  {calculatedPoints > 0 ? '+' : ''}{calculatedPoints}
                                </span>
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-6">
                              {isRefund 
                                ? 'Points will be deducted from customer balance. Final calculation based on your tenant points configuration.' 
                                : 'Final calculation based on your tenant points configuration'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Error Message */}
                      {manualEntryError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1 bg-red-100 rounded-lg">
                              <X className="h-4 w-4 text-red-600" />
                            </div>
                            <p className="text-sm text-red-700 font-medium flex-1">{manualEntryError}</p>
                          </div>
                        </motion.div>
                      )}

                      {/* Success Message */}
                      {success && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-green-50 border-2 border-green-200 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-green-100 rounded-lg">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <p className="text-sm text-green-700 font-medium">
                              {isRefund ? 'Refund processed successfully! Points deducted.' : 'Transaction created successfully! Points awarded.'} Refreshing list...
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Submit Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
                          disabled={submitting}
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          disabled={!customerInfo || !amount || submitting}
                          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-blue-500/50 flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Create Transaction
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-blue-200/30 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                    <p className="text-xs text-gray-600 text-center font-medium">
                      💡 Tip: You can also scan the customer's QR code using the scan feature
                    </p>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-4">
                <select
                  className="border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                  <option value="points">Sort by Points</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <ArrowUpDown className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr><td colSpan={5} className="text-center py-8">Loading transactions...</td></tr>
                )}
                {error && (
                  <tr><td colSpan={5} className="text-center text-red-500 py-8">{error}</td></tr>
                )}
                {!loading && !error && (!Array.isArray(transactions) || transactions.length === 0) && (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-8">No transactions found</td></tr>
                )}
                {!loading && !error && Array.isArray(transactions) && transactions.length > 0 && transactions
                  .filter(transaction => {
                    if (!transaction || typeof transaction !== 'object') return false;
                    const name = transaction.customer?.name || '';
                    const id = transaction.customer?.id || '';
                    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           id.toLowerCase().includes(searchTerm.toLowerCase());
                  })
                  .sort((a, b) => {
                    if (sortBy === 'date') {
                      return sortOrder === 'asc'
                        ? new Date(a.date).getTime() - new Date(b.date).getTime()
                        : new Date(b.date).getTime() - new Date(a.date).getTime();
                    } else if (sortBy === 'amount') {
                      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
                    } else if (sortBy === 'points') {
                      return sortOrder === 'asc' ? a.points - b.points : b.points - a.points;
                    }
                    return 0;
                  })
                  .map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.customer?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.customer?.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <PoundSterling className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {transaction.amount?.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-gray-400 mr-1" />
                          <span className={`text-sm ${
                            transaction.points >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {transaction.points >= 0 ? '+' : ''}
                            {transaction.points}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const typeInfo = getTransactionTypeInfo(transaction);
                          return (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.badgeClass}`}>
                              {typeInfo.label}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing 1 to {Array.isArray(transactions) ? transactions.length : 0} of {Array.isArray(transactions) ? transactions.length : 0} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  disabled
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 