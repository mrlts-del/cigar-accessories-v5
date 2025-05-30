'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { Address, AddressType } from 'types/address';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';


interface AccountAddressFormProps {
  initialData?: Address | null;
  onSuccess: () => void;
}

// Schema for address validation (similar to the one in AddressForm)
const addressSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(AddressType),
  name: z.string().min(1, 'Name is required'),
  line1: z.string().min(1, 'Street address is required'),
  line2: z.string().nullable().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postal: z.string().min(1, 'Zip/Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const AccountAddressForm: React.FC<AccountAddressFormProps> = ({
  initialData,
  onSuccess,
}) => {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      id: initialData?.id || '',
      type: initialData?.type || AddressType.SHIPPING, // Default to SHIPPING
      name: initialData?.name || '',
      line1: initialData?.line1 || '',
      line2: initialData?.line2 ?? '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postal: initialData?.postal || '',
      country: initialData?.country || '',
    },
  });

  // Reset form when initialData changes (for editing)
  useEffect(() => {
    form.reset({
      id: initialData?.id || '',
      type: initialData?.type || AddressType.SHIPPING,
      name: initialData?.name || '',
      line1: initialData?.line1 || '',
      line2: initialData?.line2 ?? '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postal: initialData?.postal || '',
      country: initialData?.country || '',
    });
  }, [initialData, form]);

  const onSubmit = async (values: AddressFormValues) => {
    try {
      let response;
      if (initialData) {
        // Editing existing address
        response = await fetch(`/api/users/me/addresses/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      } else {
        // Adding new address
        response = await fetch('/api/users/me/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        throw new Error(
          initialData ? 'Failed to update address' : 'Failed to add address'
        );
      }

      toast.success(initialData ? 'Address updated!' : 'Address added!');
      onSuccess(); // Close modal and revalidate data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="line1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="line2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apartment, suite, unit, etc. (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apartment 4B" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Anytown" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State / Province</FormLabel>
              <FormControl>
                <Input placeholder="CA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zip / Postal Code</FormLabel>
              <FormControl>
                <Input placeholder="90210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="United States" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Hidden field for type, default is handled by schema */}
        <FormField control={form.control} name="type" render={() => <FormItem style={{ display: 'none' }} />} />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? initialData
              ? 'Saving Changes...'
              : 'Adding Address...'
            : initialData
              ? 'Save Changes'
              : 'Add Address'}
        </Button>
      </form>
    </Form>
  );
};

export default AccountAddressForm;