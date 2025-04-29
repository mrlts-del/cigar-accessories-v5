export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Assuming ShadCN path
import SettingsForm from './components/SettingsForm'; // We will create this next
import LoadingContent from '@/app/components/ui/loading-content'; // Import LoadingContent

const AdminSettingsPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Store Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Store Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingContent description="Loading settings..." />}>
            <SettingsForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;