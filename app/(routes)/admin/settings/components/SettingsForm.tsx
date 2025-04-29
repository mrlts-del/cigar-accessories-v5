'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast'; // Assuming this path is correct
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Removed unused CardDescription, CardTitle
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

// Define the schema for the settings form
const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeContactEmail: z.string().email('Invalid email address'),
  defaultCurrencySymbol: z.string().min(1, 'Currency symbol is required').max(5),
  // Add other simple settings here if needed in the future
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsData {
  storeName?: string;
  storeContactEmail?: string;
  defaultCurrencySymbol?: string;
  [key: string]: string | undefined; // Allow other string keys
}


const SettingsForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Removed unused initialData state variable

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      storeContactEmail: '',
      defaultCurrencySymbol: '$', // Default sensible value
    },
  });

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data: SettingsData = await response.json();
        // Removed setInitialData call
        // Reset form with fetched data or defaults
        form.reset({
          storeName: data.storeName || '',
          storeContactEmail: data.storeContactEmail || '',
          defaultCurrencySymbol: data.defaultCurrencySymbol || '$',
        });
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Could not load store settings.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [form, toast]); // Dependencies

  // Handle form submission
  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedSettings: SettingsData = await response.json();
      // Removed setInitialData call
       form.reset({ // Reset form with newly saved values to reflect changes
          storeName: updatedSettings.storeName || '',
          storeContactEmail: updatedSettings.storeContactEmail || '',
          defaultCurrencySymbol: updatedSettings.defaultCurrencySymbol || '$',
        });


      toast({
        title: 'Success',
        description: 'Store settings updated successfully.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Could not save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="storeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Store Name" {...field} disabled={isSaving} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="storeContactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contact@yourstore.com" {...field} disabled={isSaving} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultCurrencySymbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Currency Symbol</FormLabel>
              <FormControl>
                <Input placeholder="$" {...field} disabled={isSaving} maxLength={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
};

export default SettingsForm;