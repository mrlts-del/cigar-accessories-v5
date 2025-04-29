import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI button path
import { cn } from '@/lib/utils'; // Assuming Shadcn UI utility function path
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Icons for buttons

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  // Don't render controls if there's only one page or less
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-between space-x-4 py-4", className)}>
      {/* Page Indicator */}
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

// Example Usage (can be removed or kept for storybook/testing)
export const PaginationControlsExample: React.FC = () => {
  const totalPages = 10;
  const [currentPage, setCurrentPage] = React.useState(3);

  const handlePageChange = (page: number) => {
    console.log("Changing to page:", page);
    setCurrentPage(page);
  };

  return (
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      className="border-t mt-4"
    />
  );
};


export default PaginationControls;