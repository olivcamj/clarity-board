'use client';

import { CreateTeamForm } from '../../components/CreateTeamForm';
import { useBackendUser } from '../../hooks/useBackendUser';
import Teams  from '../../components/Teams';

export default function DashboardPage() {
  const { userData, loading, error } = useBackendUser();

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your profile...</div>
      </div>
    );
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">
          <p>Error loading profile: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try Again
          </button>
          
        </div>
      </div>
    );
  }

  // Render user data
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <UserButton afterSignOutUrl="/" />
      </nav> */}

      <main className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Profile</h2>
          
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Name:</span> {userData?.name || 'Not set'}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {userData?.email}
            </div>
            <div>
              <span className="font-semibold">Role:</span> {userData?.role}
            </div>
            <div>
              <span className="font-semibold">Clerk ID:</span> {userData?.clerkId}
              <span className="font-bold">DB ID</span>{userData?.id}
            </div>
            <div>
              <span className="font-semibold">Member since:</span>{' '}
              {new Date(userData?.createdAt).toLocaleDateString()}
            </div>
             <div>
            </div>
          </div>
        </div>
      </main>
      <div>
        <CreateTeamForm />
        <Teams teams={userData?.teams ?? []} />
      </div>
    </div>
  );
}