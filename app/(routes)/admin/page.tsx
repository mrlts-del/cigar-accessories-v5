import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import LoadingContent from '@/app/components/ui/loading-content';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/admin/signin');
  }

  return (
    <Suspense fallback={<LoadingContent description="Loading dashboard..." />}>
      <AdminDashboardClient />
    </Suspense>
  );
}