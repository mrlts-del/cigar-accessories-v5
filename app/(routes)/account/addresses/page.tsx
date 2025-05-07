'use client';

import React, { Suspense } from 'react';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import { Address } from '../../../../types/address';

import { fetcher } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/app/components/ui/dialog';
import AccountAddressForm from '../components/AccountAddressForm'; // Using the new account address form

const AddressesPageClient = () => {
  const { data: addresses, error, isLoading, mutate } = useSWR<Address[]>('/api/users/me/addresses', fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleAddAddressClick = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEditAddressClick = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        const response = await fetch(`/api/users/me/addresses/${addressId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete address');
        }

        toast.success('Address deleted successfully!');
        mutate(); // Revalidate addresses
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
        toast.error(errorMessage);
      }
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    mutate(); // Revalidate addresses
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Addresses</CardTitle>
        <Button onClick={handleAddAddressClick}>Add New Address</Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="text-center text-destructive">
            Failed to load addresses.
          </div>
        )}
        {addresses && addresses.length === 0 && (
          <div className="text-center text-muted-foreground">
            No addresses found. Add a new address to get started.
          </div>
        )}
        {addresses && addresses.length > 0 && (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="border p-4 rounded-md flex justify-between items-center">
                <div>
                  <p>{address.name}</p>
                  <p className="text-sm text-muted-foreground">{address.line1}, {address.city}, {address.state} {address.postal}, {address.country}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditAddressClick(address)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAddress(address.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          <AccountAddressForm
            initialData={editingAddress}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const AddressesPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddressesPageClient />
    </Suspense>
  );
};

export default AddressesPage;