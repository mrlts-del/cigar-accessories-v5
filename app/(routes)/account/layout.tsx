'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Container from '@/components/ui/container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Heading from '@/components/ui/heading';


interface AccountLayoutProps {
  children: ReactNode;
}

const AccountLayout: React.FC<AccountLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  const routes = [
    {
      href: '/account/profile',
      label: 'Profile',
      active: pathname === '/account/profile',
    },
    {
      href: '/account/addresses',
      label: 'Addresses',
      active: pathname === '/account/addresses',
    },
    {
      href: '/account/orders',
      label: 'Orders',
      active: pathname === '/account/orders',
    },
  ];

  return (
    <Container>
      <Heading title="My Account" description="Manage your account settings" />
      <Separator className="my-4" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <nav className="flex flex-col space-y-2">
            {routes.map((route) => (
              <Link key={route.href} href={route.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    route.active
                      ? "bg-muted hover:bg-muted"
                      : "hover:bg-transparent hover:underline"
                  )}
                >
                  {route.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="md:col-span-3">{children}</main>
      </div>
    </Container>
  );
};

export default AccountLayout;