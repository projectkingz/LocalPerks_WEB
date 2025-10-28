'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle,
  Filter,
  Search,
  Shield,
  Crown
} from 'lucide-react';
import EditUserModal from './components/EditUserModal';
import ScrollControls from '@/components/ScrollControls';
import TableScrollControls from '@/components/TableScrollControls';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  suspended?: boolean;
  approvalStatus?: string; // "PENDING", "ACTIVE", "SUSPENDED"
  createdAt: string;
  updatedAt: string;
  tenantId: string | null;
  businessName?: string | null; // Business name for partners
  points: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (updatedUser: Partial<User>) => {
    if (!editingUser) return;

    try {
      setEditLoading(true);
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      const updatedUserData = await response.json();
      
      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, ...updatedUserData } : user
      ));
      
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, suspended: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, suspended } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleApprovePartner = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: 'ACTIVE' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve partner');
      }
      
      const updatedUserData = await response.json();
      
      // Update local state with both approvalStatus and suspended
      setUsers(users.map(user => 
        user.id === userId ? { 
          ...user, 
          approvalStatus: updatedUserData.approvalStatus,
          suspended: updatedUserData.suspended 
        } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // If there's related data, offer force delete option
        if (errorData.hasRelatedData) {
          const forceDelete = confirm(
            `This user has related data: ${errorData.relatedData.join(', ')}.\n\n` +
            `Do you want to force delete the user and all related data?\n\n` +
            `⚠️ WARNING: This will permanently delete:\n` +
            `• All user transactions\n` +
            `• All user activities\n` +
            `• Tenant associations\n` +
            `• Partner tenant relationships\n\n` +
            `This action cannot be undone.`
          );
          
          if (forceDelete) {
            const forceResponse = await fetch(`/api/admin/users/${userId}?force=true`, {
              method: 'DELETE',
            });
            
            if (!forceResponse.ok) {
              const forceErrorData = await forceResponse.json();
              throw new Error(forceErrorData.message || 'Failed to force delete user');
            }
            
            const forceSuccessData = await forceResponse.json();
            setError(null); // Clear any previous errors
            // Remove from local state
            setUsers(users.filter(user => user.id !== userId));
            return;
          } else {
            throw new Error(errorData.message);
          }
        }
        
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      // Remove from local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Bulk action handlers
  const handleToggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleToggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`Are you sure you want to approve ${selectedUsers.size} user(s)?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(userId => 
        fetch(`/api/admin/users/${userId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvalStatus: 'APPROVED' }),
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every(r => r.ok);

      if (allOk) {
        // Refresh the user list
        await fetchUsers();
        setSelectedUsers(new Set());
        setError(null);
      } else {
        setError('Failed to approve some users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during bulk approval');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`Are you sure you want to suspend ${selectedUsers.size} user(s)?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(userId => 
        fetch(`/api/admin/users/${userId}/suspend`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suspended: true }),
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every(r => r.ok);

      if (allOk) {
        await fetchUsers();
        setSelectedUsers(new Set());
        setError(null);
      } else {
        setError('Failed to suspend some users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during bulk suspend');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`⚠️ WARNING: Are you sure you want to permanently delete ${selectedUsers.size} user(s)? This action cannot be undone.`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(userId => 
        fetch(`/api/admin/users/${userId}?force=true`, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every(r => r.ok);

      if (allOk) {
        await fetchUsers();
        setSelectedUsers(new Set());
        setError(null);
      } else {
        setError('Failed to delete some users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during bulk delete');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkEdit = () => {
    const selectedUsersArray = users.filter(u => selectedUsers.has(u.id));
    if (selectedUsersArray.length > 0) {
      // Start editing the first selected user
      setEditingUser(selectedUsersArray[0]);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="h-4 w-4 text-purple-600" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'PARTNER':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'CUSTOMER':
        return <Users className="h-4 w-4 text-gray-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const canDeleteUser = (user: User) => {
    // Only SUPER_ADMIN can delete users
    if (!isSuperAdmin) return false;
    // SUPER_ADMIN cannot delete themselves
    if (user.id === session?.user?.id) return false;
    // Cannot delete other SUPER_ADMIN users
    if (user.role === 'SUPER_ADMIN') return false;
    // Note: We can't check for related data here since it's not included in the user object
    // The API will handle this check and return appropriate error messages
    return true;
  };

  const canManageUser = (user: User) => {
    if (isSuperAdmin) return true;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return false;
    return true;
  };

  const canEditUser = (user: User) => {
    if (isSuperAdmin) return true;
    if (user.role === 'SUPER_ADMIN') return false;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollControls />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all users and accounts
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddUser(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </motion.button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="PARTNER">Partners</option>
              {isSuperAdmin && <option value="ADMIN">Admins</option>}
              {isSuperAdmin && <option value="SUPER_ADMIN">Super Admins</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve All
              </button>
              <button
                onClick={handleBulkSuspend}
                disabled={bulkActionLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-amber-700 bg-amber-100 hover:bg-amber-200 disabled:opacity-50"
              >
                <Ban className="h-3 w-3 mr-1" />
                Suspend All
              </button>
              {isSuperAdmin && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete All
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedUsers(new Set())}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                  User
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Role
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Points
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Actions
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleToggleSelectUser(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 min-w-0 flex-1">
                        {user.role === 'PARTNER' ? (
                          <>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {user.businessName || 'No business name'}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {user.name || 'No owner name'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {user.email}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {user.email}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-1 text-xs text-gray-900">
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.approvalStatus === 'UNDER_REVIEW'
                        ? 'bg-yellow-100 text-yellow-800'
                        : user.approvalStatus === 'PENDING' || user.approvalStatus === 'PENDING_EMAIL_VERIFICATION'
                        ? 'bg-orange-100 text-orange-800'
                        : user.approvalStatus === 'SUSPENDED' || user.suspended
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.approvalStatus === 'UNDER_REVIEW' ? 'Review' :
                       user.approvalStatus === 'PENDING' ? 'Pending' : 
                       user.approvalStatus === 'PENDING_EMAIL_VERIFICATION' ? 'Email' :
                       user.approvalStatus === 'SUSPENDED' || user.suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                    {user.points.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-right text-xs font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      {canEditUser(user) && (
                        <button
                          onClick={() => setEditingUser(user)}
                          className="inline-flex items-center px-1.5 py-0.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                          title="Edit user"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      )}
                      
                      {/* Activate/Suspend Button */}
                      {canManageUser(user) && (
                        user.suspended || ['PENDING', 'UNDER_REVIEW', 'PENDING_EMAIL_VERIFICATION', 'PENDING_MOBILE_VERIFICATION'].includes(user.approvalStatus || '') ? (
                          <button
                            onClick={() => handleApprovePartner(user.id)}
                            className="inline-flex items-center px-1.5 py-0.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                            title="Activate user"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendUser(user.id, true)}
                            className="inline-flex items-center px-1.5 py-0.5 border border-transparent text-xs font-medium rounded text-amber-700 bg-amber-100 hover:bg-amber-200"
                            title="Suspend user"
                          >
                            <Ban className="h-3 w-3" />
                          </button>
                        )
                      )}
                      
                      {canDeleteUser(user) ? (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center px-1.5 py-0.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                          title="Delete user"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center px-1.5 py-0.5 border border-transparent text-xs font-medium rounded text-gray-400 bg-gray-100 cursor-not-allowed"
                          title="Only Super Admins can delete users"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleEditUser}
        currentUserRole={session?.user?.role || ''}
        loading={editLoading}
      />

      {/* Add User Modal - Placeholder */}
      {showAddUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Add User</h3>
              <p className="text-sm text-gray-500 mt-2">
                This feature will be implemented next
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
} 