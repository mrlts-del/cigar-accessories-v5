import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';

// Server Component: Handles admin-only access and session check
export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  // Only allow admins
  if (!session || session.user.role !== 'ADMIN') {
    redirect("/signin"); // Or show a 403 page if preferred
  }

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Analytics Content Here */}
    </main>
  );
}