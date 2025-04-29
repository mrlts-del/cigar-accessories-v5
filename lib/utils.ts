import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// Basic price formatter (customize currency, locale as needed)
export function formatPrice(price: number | string | Decimal | undefined | null, options: Intl.NumberFormatOptions = {}) {
  const numericPrice = typeof price === 'object' && price !== null && 'toNumber' in price
    ? price.toNumber() // Convert Decimal to number
    : typeof price === 'string'
    ? parseFloat(price)
    : price ?? 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: options.currency ?? 'USD', // Default to USD
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    ...options,
  }).format(numericPrice);
}

// Helper function to extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return ''; // Not a standard Cloudinary URL structure
    let relevantPart = parts[1];
    // Remove version number if present (e.g., /v123456/)
    relevantPart = relevantPart.replace(/v\d+\//, '');
    // Remove file extension if present
    const lastDotIndex = relevantPart.lastIndexOf('.');
    const publicId = lastDotIndex > -1 ? relevantPart.substring(0, lastDotIndex) : relevantPart;
    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error, "URL:", url);
    return ''; // Fallback or error handling
  }
};

// Basic slugify function
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// Utility function for fetching data
export const fetcher = (url: string) => fetch(url).then(res => res.json());
