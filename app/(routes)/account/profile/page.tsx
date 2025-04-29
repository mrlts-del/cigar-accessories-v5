'use client';

import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';

import { Loader2 } from 'lucide-react';

import { fetcher } from '@/lib/utils'; // Assuming fetcher utility exists
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  // Add other user fields if needed
}

const ProfilePage = () => {
  const { data: user, error, isLoading, mutate } = useSWR<UserProfile>('/api/users/me', fetcher);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
    },
    values: { // Use values to update form when user data changes
      name: user?.name || '',
    }
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      mutate(updatedUser); // Update SWR cache
      toast.success('Profile updated successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="text-center text-destructive">
            Failed to load profile.
          </div>
        )}
        {user && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                  <FormLabel>Email</FormLabel>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          )}
      </CardContent>
    </Card>
  );
};

export default ProfilePage;