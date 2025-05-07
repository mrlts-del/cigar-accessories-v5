'use client';
import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query'; // Removed unused useMutation, useQueryClient
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { format } from 'date-fns';
import { Edit, Trash2, Star } from 'lucide-react'; // Removed PlusCircle

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingContent from '@/app/components/ui/loading-content'; // Adjusted path
import { useToast } from '@/hooks/use-toast';
// We will create/use these later
// import ReviewFormModal from './components/ReviewFormModal';
// import ConfirmModal from '@/components/ConfirmModal';

// Define the structure for a Review
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string; // Assuming ISO date string
  product: { // Include product info for context
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  // Add userId if needed, though API should filter by authenticated user
}

// Function to fetch user reviews (Assuming API filters by authenticated user)
const fetchUserReviews = async (): Promise<Review[]> => {
  // The prompt lists GET /api/reviews. We assume the backend filters by the logged-in user.
  // If it requires explicit user ID, adjust the endpoint: `/api/reviews?userId=me` or similar.
  const { data } = await axios.get('/api/reviews');
  return data;
};

// Placeholder functions for mutations (implement later)
// Removed unused deleteReview function

export default function ReviewsPage() {
  const { status } = useSession({ required: true }); // Removed unused session
  // Removed unused queryClient variable
  const { toast } = useToast();

  // State for modals (will be added later)
  // Removed unused isFormModalOpen and setIsFormModalOpen state
  const [, setIsDeleteModalOpen] = useState(false); // Removed unused isDeleteModalOpen
  const [/*selectedReview*/, setSelectedReview] = useState<Review | null>(null); // Commented out unused selectedReview

  const { data: reviews, isLoading, isError, error } = useQuery({
    queryKey: ['userReviews'],
    queryFn: fetchUserReviews,
    enabled: status === 'authenticated',
  });

  // Delete Mutation
  // Delete mutation is currently unused and has been removed.
  // If delete functionality is added later, uncomment and implement the mutation call.


  // Handlers for add/edit/delete
  // Removed unused handleAddReview function
  const handleEditReview = (review: Review) => {
    // setSelectedReview(review);
    // setIsFormModalOpen(true);
     toast({ title: "Edit Review Clicked (WIP)", description: `ID: ${review.id}` });
  };

  const handleDeleteReview = (review: Review) => {
     setSelectedReview(review);
     setIsDeleteModalOpen(true); // Open confirmation modal
     // Actual deletion happens in the modal's confirm handler
     // toast({ title: "Delete Review Clicked (WIP)", description: `ID: ${review.id}` });
  };

  // Removed unused confirmDelete function
  // Helper to format date
  const formatDate = (dateString: string) => {
      try {
          return format(new Date(dateString), 'PPP'); // e.g., Jun 21, 2024
      } catch { // Removed unused error variable
          return 'Invalid Date';
      }
  }

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return <LoadingContent description="Loading your reviews..." />;
  }

  if (isError) {
    return <p className="text-red-500">Error loading reviews: {error.message}</p>;
  }

  return (
    <Suspense fallback={<LoadingContent description="Loading reviews page..." />}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Reviews</CardTitle>
            <CardDescription>Manage your product reviews.</CardDescription>
          </div>
          {/* Add Review button might be better placed elsewhere (e.g., on order history or product page) */}
          {/* <Button onClick={handleAddReview} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Review
          </Button> */}
        </CardHeader>
        <CardContent>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4 flex-1">
                     {/* Product Image + Link */}
                     <Link href={`/products/${review.product.slug}`} className="block w-[80px] h-[80px] relative border rounded">
                        <Image
                            src={review.product.image || '/placeholder.png'}
                            alt={review.product.name}
                            fill // Use fill for responsive sizing within the container
                            sizes="(max-width: 640px) 80px, 80px" // Provide sizes hint
                            className="object-cover rounded" // Keep object-cover
                        />
                     </Link>
                     {/* Review Details */}
                     <div className="flex-1">
                        <Link href={`/products/${review.product.slug}`} className="font-semibold hover:underline">
                            {review.product.name}
                        </Link>
                        <div className="flex items-center my-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{review.comment || "No comment provided."}</p>
                        <p className="text-xs text-gray-500">Reviewed on: {formatDate(review.createdAt)}</p>
                     </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex space-x-2 self-start sm:self-center">
                    <Button variant="outline" size="icon" onClick={() => handleEditReview(review)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Review</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteReview(review)}>
                      <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Delete Review</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // eslint-disable-next-line react/no-unescaped-entities
            <p className="text-center text-muted-foreground py-8">You haven't written any reviews yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Modals will go here */}
      {/* <ReviewFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        review={selectedReview}
      /> */}
      {/* <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete your review for ${selectedReview?.product?.name}? This action cannot be undone.`}
        isLoading={deleteMutation.isLoading}
      /> */}
      </div>
    </Suspense>
  );
}