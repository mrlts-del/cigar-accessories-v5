'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartDrawer } from "./CartDrawer";
import { useCartStore } from "@/hooks/useCartStore";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "Collection" },
  { href: "/cigar-lounge", label: "Cigar Lounge" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export const NavbarClientContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook usage is now isolated here
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const cartStore = useCartStore();
  const { status } = useSession(); // Hook usage is now isolated here

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    router.push(`/collection?${params.toString()}`);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu */}
      <div className="md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm">
            <nav className="grid gap-6 text-lg font-medium mt-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="">Cigar Accessories</span>
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white hover:text-gray-300" // Assuming dark theme for drawer
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 pt-4 border-t">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" variant="ghost">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </form>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Logo & Links */}
      <Link href="/" className="hidden items-center gap-2 md:flex">
        <span className="text-lg font-bold tracking-tight">Cigar Accessories</span>
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-white transition-colors hover:text-gray-300"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Search and Actions (Desktop + Mobile alignment) */}
      <div className="flex flex-1 items-center justify-end gap-2 md:flex-initial">
        {/* Desktop Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 ml-auto">
          <Input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-[150px] lg:w-[250px]"
          />
          <Button type="submit" size="icon" variant="ghost">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        </form>

        {/* Cart Icon/Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCartDrawerOpen(true)}
          className="relative"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">Shopping Cart</span>
          {cartStore.items.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {cartStore.items.length}
            </span>
          )}
        </Button>

        {/* Cart Drawer Component */}
        <CartDrawer open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen} />

        {/* Account/Login/Logout */}
        {status === 'authenticated' ? (
          <>
            <Link href="/account" className="text-sm font-medium text-white hover:text-gray-300">
              Account
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-white hover:text-gray-300">
              Login
            </Link>
          </>
        )}
      </div>
    </>
  );
};