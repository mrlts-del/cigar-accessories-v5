import "./globals.css";
import { Suspense } from 'react'; // Import Suspense
import ClientProviders from 'providers/ClientProviders'; // Import the combined provider
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
// Removed UIProvider, ReactQueryProvider, SessionProviderWrapper, Toaster imports
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cigar Accessories Store",
  description: "E-commerce store for cigar accessories",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientProviders> {/* Use the combined provider */}
          {/* Wrap Navbar in Suspense as it uses useSearchParams */}
          <Suspense fallback={<div>Loading navigation...</div>}>
            <Navbar />
          </Suspense>
          {children}
          {/* Toaster is now included within ClientProviders */}
        </ClientProviders>
        <Footer />
        {/* TapPay SDK */}
        <script src="https://js.tappaysdk.com/sdk/tpdirect/v5.17.0" async></script>
      </body>
    </html>
  );
}