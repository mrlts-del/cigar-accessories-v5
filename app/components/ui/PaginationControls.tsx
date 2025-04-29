"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Use components/ui path
import { ArrowLeft, ArrowRight } from 'lucide-react'; // Icons for buttons

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  // pageSize is implicitly handled by the parent component's fetch logic
}

export default function PaginationControls({
  currentPage,
  totalPages,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', String(newPage));

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`, { scroll: false }); // Prevent scroll jump
  };

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (totalPages <= 1) {
    return null; // Don't render controls if there's only one page
  }

  return (
    <div className="mt-8 flex justify-center items-center space-x-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        aria-label="Go to previous page"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm font-medium text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Go to next page"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}