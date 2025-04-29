import { describe, it, expect, jest } from '@jest/globals'; // Import Jest globals
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from './ProductCard';
// Removed unused Decimal import
// Removed unused TestingLibraryMatchers import
import Image from 'next/image'; // Import next/image

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink'; // Add display name
  return MockLink;
});

// Mock Cloudinary AdvancedImage component and related modules
jest.mock('@cloudinary/react', () => ({
  // Use next/image in the mock
  AdvancedImage: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => <Image alt={alt} {...props} data-testid="cloudinary-image" src="/mock-image.jpg" width={100} height={100} />, // Provide mock src/width/height
}));

// Mock the specific actions used by ProductCard.tsx, ensuring chainable methods are mocked
jest.mock('@cloudinary/url-gen/actions/resize', () => ({
  fill: jest.fn(() => ({
    width: jest.fn().mockReturnThis(), // Return `this` to allow chaining
    height: jest.fn().mockReturnThis(),
    gravity: jest.fn().mockReturnThis(),
  })),
}));
jest.mock('@cloudinary/url-gen/actions/delivery', () => ({
  format: jest.fn((val: unknown) => ({ type: 'format', value: val })), // Use unknown
  quality: jest.fn((val: unknown) => ({ type: 'quality', value: val })), // Use unknown
  auto: jest.fn(() => 'mock-delivery-or-quality-auto-action'), // Keep existing auto mock
}));
// Removed mock for '@cloudinary/url-gen/actions/quality' as it's imported from delivery now

// Mock the local Cloudinary config/instance used to create the image object
jest.mock('../../lib/cloudinaryFrontend', () => ({ // Use relative path for mocking
  __esModule: true,
  default: {
    // Mock the image method and its chainable methods
    image: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    delivery: jest.fn().mockReturnThis(),
    quality: jest.fn().mockReturnThis(),
    // Add other methods if ProductCard starts using them
  },
}));

// Define the Product type matching the component's expectation
// Note: Adjust if the actual Product type uses Decimal for price
type Product = {
  id: string;
  name: string;
  price: number; // Or Decimal
  imagePath: string | null; // Use imagePath and allow null
};

describe('ProductCard Component', () => {
  const mockProduct: Product = {
    id: 'prod-123',
    name: 'Test Cigar Humidor',
    price: 199.99,
    imagePath: '/uploads/products/sample.jpg', // Use a mock local path
  };

  it('renders product name, price, and image alt text', () => {
    render(<ProductCard product={mockProduct} />);

    // Check for product name
    expect(screen.getByText('Test Cigar Humidor')).toBeInTheDocument();

    // Check for product price (formatted as in the component)
    // The component uses .toFixed(2), so we expect $199.99
    expect(screen.getByText('$199.99')).toBeInTheDocument();

    // Check for image alt text
    // The component uses product.name as alt text
    expect(screen.getByAltText('Test Cigar Humidor')).toBeInTheDocument();
  });

  it('renders as a link to the product page', () => {
    render(<ProductCard product={mockProduct} />);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', `/products/${mockProduct.id}`);
  });
});