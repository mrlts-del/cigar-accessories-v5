export const dynamic = 'force-dynamic';
import React, { Suspense } from "react";
// Removed unused dynamic import
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import AnalyticsDashboard from "./AnalyticsDashboard";
import LoadingContent from '@/app/components/ui/loading-content'; // Import LoadingContent

// Server Component: Handles admin-only access and session check
export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  // Only allow admins
  if (!session || !session.user.isAdmin) {
    redirect("/admin"); // Or show a 403 page if preferred
  }

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      {/* Client-side dashboard */}
      <Suspense fallback={<LoadingContent description="Loading analytics..." />}>
        <AnalyticsDashboard />
      </Suspense>
    </main>
  );
}