'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function TestAdminEdit() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testEditUser = async () => {
    setLoading(true);
    setTestResult('Testing admin edit functionality...');
    
    try {
      // First, get a list of users
      const usersResponse = await fetch('/api/admin/users');
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`);
      }
      
      const users = await usersResponse.json();
      if (users.length === 0) {
        setTestResult('No users found to test with');
        return;
      }

      // Try to edit the first user (excluding the current user)
      const testUser = users.find((user: any) => user.id !== session?.user?.id) || users[0];
      
      const editData = {
        name: `${testUser.name || 'Test User'} (Edited)`,
        points: (testUser.points || 0) + 100,
      };

      const editResponse = await fetch(`/api/admin/users/${testUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (editResponse.ok) {
        const updatedUser = await editResponse.json();
        setTestResult(`✅ Edit successful! Updated user: ${updatedUser.name} (${updatedUser.points} points)`);
      } else {
        const error = await editResponse.text();
        setTestResult(`❌ Edit failed: ${editResponse.status} - ${error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testRolePermissions = async () => {
    setLoading(true);
    setTestResult('Testing role-based permissions...');
    
    try {
      const usersResponse = await fetch('/api/admin/users');
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`);
      }
      
      const users = await usersResponse.json();
      const testUser = users.find((user: any) => user.role === 'CUSTOMER') || users[0];
      
      // Test role change (should only work for SUPER_ADMIN)
      const roleEditData = {
        role: 'PARTNER',
      };

      const roleEditResponse = await fetch(`/api/admin/users/${testUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleEditData),
      });

      if (roleEditResponse.ok) {
        setTestResult(`✅ Role change successful! (You are SUPER_ADMIN)`);
      } else {
        const error = await roleEditResponse.text();
        setTestResult(`❌ Role change failed: ${roleEditResponse.status} - ${error} (Expected for ADMIN users)`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Edit Functionality Test</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Current Session:</h2>
        <p>Status: {status}</p>
        {session && (
          <div>
            <p>Email: {session.user?.email}</p>
            <p>Role: {session.user?.role}</p>
            <p>Name: {session.user?.name}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={testEditUser}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Edit User'}
        </button>

        <button
          onClick={testRolePermissions}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Role Permissions'}
        </button>
      </div>

      {testResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <p>{testResult}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">Admin Edit Features:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>ADMIN</strong>: Can edit name, email, points, tenantId, suspended status</li>
          <li><strong>SUPER_ADMIN</strong>: Can edit everything including roles and passwords</li>
          <li><strong>ADMIN</strong>: Cannot edit SUPER_ADMIN users</li>
          <li><strong>SUPER_ADMIN</strong>: Can edit all users including other SUPER_ADMINs</li>
        </ul>
      </div>
    </div>
  );
} 