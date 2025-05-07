import "./globals.css";
import { Suspense } from 'react';
// Remove ReactQueryProvider import, it's handled by ClientProviders now
import ClientProviders from 'providers/ClientProviders'; // Import the new combined provider
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Analytics from "@/components/Analytics";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

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
        {/* Wrap the main content with ClientProviders */}
        <ClientProviders>
          <Suspense fallback={<div>Loading navigation...</div>}>
            <Navbar />
          </Suspense>
          <main className="flex-grow"> {/* Added main tag for semantic structure */}
             {children}
          </main>
          <Toaster /> {/* Add Toaster for react-hot-toast */}
        </ClientProviders>
        <Footer />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        {/* External scripts can remain outside providers if they don't depend on them */}
        <script src="https://js.tappaysdk.com/sdk/tpdirect/v5.17.0" async></script>
      </body>
    </html>
  );
}