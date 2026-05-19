/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { axiosInstance } from '@/api/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestApiCall = async () => {
    setIsLoading(true);
    setTestResult(null);
    setTestError(null);

    try {
      const response = await axiosInstance.get('/api/auth/profile');
      setTestResult(response.data);
      toast.success('API call successful! Token refresh is working.');
      console.log('[TEST] API response:', response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message || 'API call failed';
      setTestError(errorMsg);
      toast.error(`API call failed: ${errorMsg}`);
      console.error('[TEST] API error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-gray-600">Welcome to your learning center</p>
      </div>

      {/* Test Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-xl font-semibold mb-2">Token Refresh Test</h2>
        <p className="text-sm text-gray-700 mb-4">
          Test the automatic token refresh mechanism. Wait 1 minute after login for the access token to expire,
          then click the button below. The API call should automatically refresh your tokens without you seeing a login redirect.
        </p>

        <button
          onClick={handleTestApiCall}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition flex items-center justify-center"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Testing API...' : 'Test API Call with Token Refresh'}
        </button>

        {testError && (
          <div className="mt-4 rounded-lg bg-red-100 p-4 text-red-800">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{testError}</p>
          </div>
        )}

        {testResult && (
          <div className="mt-4 rounded-lg bg-green-100 p-4 text-green-800">
            <p className="font-semibold">Success! Response:</p>
            <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs text-gray-800 max-h-48">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'MCQs Attempted', value: '847', icon: '📚' },
          { label: 'Active Courses', value: '3', icon: '🎓' },
          { label: 'Active Mentor', value: '1', icon: '👥' },
          { label: 'Avg. Test Score', value: '78%', icon: '🏆' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {[
          'Study Materials',
          'Exam Practice',
          'Leaderboard',
          'Community Posts',
        ].map((feature) => (
          <div key={feature} className="rounded-lg border border-gray-200 bg-white p-6 opacity-50">
            <div className="text-center">
              <p className="text-lg font-semibold">{feature}</p>
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
