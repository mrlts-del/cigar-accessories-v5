"use client";

import React from "react";
import SessionProviderWrapper from './SessionProviderWrapper';
import { ReactQueryProvider } from './react-query-provider';
import { UIProvider } from './ui-provider';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/components/ui/toast';

interface Props {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: Props) {
  return (
    <SessionProviderWrapper>
      <ReactQueryProvider>
        <ToastProvider>
          <UIProvider>
            {children}
            <Toaster />
          </UIProvider>
        </ToastProvider>
      </ReactQueryProvider>
    </SessionProviderWrapper>
  );
}