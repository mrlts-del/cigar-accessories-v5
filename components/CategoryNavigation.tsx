import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming Shadcn UI button path
import { cn } from '@/lib/utils'; // Assuming Shadcn UI utility function path

interface Category {
  name: string;
  slug: string;
}

interface CategoryNavigationProps {
  categories: Category[];
  currentCategory?: string | null; // Slug of the current category, or null for "ALL"
  onSelectCategory: (slug: string | null) => void;
  className?: string;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categories,
  currentCategory = null, // Default to "ALL ARTICLES" if not provided
  onSelectCategory,
  className,
}) => {
  return (
    <div className={cn("overflow-x-auto pb-2", className)}>
      <div className="flex space-x-2 whitespace-nowrap">
        {/* "ALL ARTICLES" Button */}
        <Button
          variant={currentCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectCategory(null)}
          className="shrink-0"
        >
          ALL ARTICLES
        </Button>

        {/* Category Buttons */}
        {categories.map((category) => (
          <Button
            key={category.slug}
            variant={currentCategory === category.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectCategory(category.slug)}
            className="shrink-0"
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Example Usage (can be removed or kept for storybook/testing)
export const CategoryNavigationExample: React.FC = () => {
  const sampleCategories: Category[] = [
    { name: "Technology", slug: "technology" },
    { name: "Lifestyle", slug: "lifestyle" },
    { name: "Business", slug: "business" },
    { name: "Travel", slug: "travel" },
    { name: "Food", slug: "food" },
    { name: "Health", slug: "health" },
    { name: "Science", slug: "science" },
  ];
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>('technology');

  const handleSelect = (slug: string | null) => {
    console.log("Selected category slug:", slug);
    setSelectedCategory(slug);
  };

  return (
    <CategoryNavigation
      categories={sampleCategories}
      currentCategory={selectedCategory}
      onSelectCategory={handleSelect}
      className="border-b"
    />
  );
};

export default CategoryNavigation;