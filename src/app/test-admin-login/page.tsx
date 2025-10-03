'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function TestAdminLogin() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<string>('');

  const testAdminLogin = async () => {
    setTestResult('Testing admin login flow...');
    
    try {
      // Test the admin API endpoint
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Admin API working! Found ${data.length} users`);
      } else {
        setTestResult(`❌ Admin API failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Login Test</h1>
      
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

      <button
        onClick={testAdminLogin}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Admin API
      </button>

      {testResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <p>{testResult}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">Admin Login Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to <a href="/auth/signin?type=admin" className="text-blue-600 underline">Admin Sign In</a></li>
          <li>Login with: admin@example.com / password123</li>
          <li>You should be redirected to /admin</li>
          <li>If you see this page, the login worked!</li>
        </ol>
      </div>
    </div>
  );
} 