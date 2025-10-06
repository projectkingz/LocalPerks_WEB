'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils/date';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface PendingTransaction {
  id: string;
  customerEmail: string;
  date: string;
  points: number;
  description: string;
  amount: number;
  receiptImage?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export default function PendingApprovalsPage() {
  const { data: session } = useSession();
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchPendingTransactions = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/admin/pending-transactions');
        if (!response.ok) {
          throw new Error('Failed to fetch pending transactions');
        }
        
        const data = await response.json();
        setPendingTransactions(data.pendingTransactions);
        // Reset to first page when new data is loaded
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching pending transactions:', error);
        setError('Failed to load pending transactions');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchPendingTransactions();
    }
  }, [session?.user?.email]);

  // Pagination calculations
  const totalPages = Math.ceil(pendingTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTransactions = pendingTransactions.slice(startIndex, endIndex);

  const handleApprove = async (transactionId: string) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/pending-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          action: 'approve',
          adminNotes: adminNotes.trim() || undefined
        }),
      });

      if (response.ok) {
        // Remove from pending list
        setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
        setSelectedTransaction(null);
        setAdminNotes('');
        
        // Adjust current page if we're on the last page and it becomes empty
        if (currentTransactions.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        throw new Error('Failed to approve transaction');
      }
    } catch (error) {
      setError('Failed to approve transaction');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (transactionId: string) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/pending-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          action: 'reject',
          adminNotes: adminNotes.trim() || undefined
        }),
      });

      if (response.ok) {
        // Remove from pending list
        setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
        setSelectedTransaction(null);
        setAdminNotes('');
        
        // Adjust current page if we're on the last page and it becomes empty
        if (currentTransactions.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        throw new Error('Failed to reject transaction');
      }
    } catch (error) {
      setError('Failed to reject transaction');
    } finally {
      setProcessing(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedTransaction(null); // Clear selection when changing pages
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    setSelectedTransaction(null); // Clear selection
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve customer receipt submissions
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{pendingTransactions.length} pending</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading pending transactions...</span>
          </div>
        </div>
      ) : pendingTransactions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
            <p className="text-gray-500">All receipt submissions have been processed.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Transactions List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Receipt Submissions</h2>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {currentTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTransaction?.id === transaction.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.customerEmail} • {formatDate(transaction.date)}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-sm text-gray-600">
                          Amount: £{transaction.amount.toFixed(2)}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          +{transaction.points} points
                        </span>
                      </div>
                    </div>
                    {transaction.receiptImage && (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, pendingTransactions.length)} of {pendingTransactions.length} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 text-sm rounded ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Details and Actions */}
          {selectedTransaction && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white shadow rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Review Transaction
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <p className="text-sm text-gray-900">{selectedTransaction.customerEmail}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <p className="text-sm text-gray-900">£{selectedTransaction.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <p className="text-sm font-medium text-green-600">+{selectedTransaction.points}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTransaction.date)}</p>
                </div>

                {selectedTransaction.receiptImage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receipt Image
                    </label>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedTransaction.receiptImage}
                      alt="Receipt"
                      className="max-w-full h-auto rounded border"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add notes about this transaction..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedTransaction.id)}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processing ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedTransaction.id)}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {processing ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
} 