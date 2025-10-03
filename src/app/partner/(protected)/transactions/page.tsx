'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Download,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Award,
  PoundSterling
} from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

export default function PartnerTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions History</h1>
            <p className="mt-1 text-sm text-gray-500">View and manage your business transactions</p>
          </div>
          <button
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-gray-600"
          >
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>

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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.points >= 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.points >= 0 ? 'Purchase' : 'Reward Redemption'}
                        </span>
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