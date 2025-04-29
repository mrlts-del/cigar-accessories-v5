import React, { Suspense } from 'react';
import CollectionClientContent from '@/components/CollectionClientContent'; // Import the new client component
import Container from "@/components/ui/container"; // Keep Container if needed for layout outside Suspense

// This page is now a Server Component.
// It wraps the client component that uses hooks like useSearchParams.

const CollectionPage = () => {
  return (
    // You might keep some layout elements like Container here if they don't depend on client hooks
    // Or move Container inside CollectionClientContent if the whole page structure depends on client state
    // For simplicity, let's assume Container is okay here for now.
    // <Container>
      <Suspense fallback={
        // Simple text fallback
        // <div>Loading collection...</div>

        // Or a more structured skeleton fallback matching the client component's initial loading state
        <Container>
            {/* Mimic initial layout */}
            <div className="text-sm text-gray-500 py-4">Loading...</div>
            <h1 className="text-3xl font-bold mb-4">Shop All Collections</h1>
            <p className="text-gray-700 mb-4">Loading description...</p>
            <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-6">Loading banner...</div>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Skeleton */}
                <div className="w-64 flex-shrink-0 hidden md:block">
                    <div className="border-r pr-8">
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>
                        {/* Add skeleton elements for filters if desired */}
                    </div>
                </div>
                {/* Main Content Skeleton */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-gray-600">Loading products...</div>
                        {/* Skeleton for sort dropdown */}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Render multiple product card skeletons */}
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={`fallback-skeleton-${index}`} className="flex flex-col space-y-3">
                                <div className="aspect-square w-full rounded-xl bg-gray-200 animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Container>
      }>
        <CollectionClientContent />
      </Suspense>
    // </Container>
  );
}

export default CollectionPage;