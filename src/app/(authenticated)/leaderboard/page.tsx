import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/auth.config";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-lg mb-4">Top Points Earners</p>
        {/* Add your leaderboard content here */}
      </div>
    </div>
  );
} 