// app/components/Navbar.tsx
import React, { Suspense } from 'react'; // Import Suspense
import { NavbarClientContent } from './NavbarClientContent'; // Import the new client component

const Navbar = () => {
  // Removed client-side hooks and state management from here

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-black text-white">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Wrap the client-dependent content in Suspense */}
        <Suspense fallback={<NavbarSkeleton />}>
          <NavbarClientContent />
        </Suspense>
      </div>
    </header>
  );
};

// Basic skeleton loader for the navbar content while client component loads
const NavbarSkeleton = () => {
  return (
    <>
      {/* Mobile Menu Skeleton */}
      <div className="md:hidden">
        <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Menu button */}
      </div>

      {/* Desktop Logo Skeleton */}
      <div className="hidden items-center gap-2 md:flex">
        <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Logo */}
      </div>
      {/* Desktop Nav Links Skeleton */}
      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-12 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
      </nav>

      {/* Actions Skeleton */}
      <div className="flex flex-1 items-center justify-end gap-2 md:flex-initial">
         <div className="hidden md:flex items-center gap-2 ml-auto">
             <div className="h-9 w-[150px] lg:w-[250px] bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Search input */}
             <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Search button */}
         </div>
        <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Cart */}
        <div className="h-8 w-16 bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Login/Account */}
      </div>
    </>
  );
};


export default Navbar;