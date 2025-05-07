'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from 'components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from 'components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from 'components/ui/form';
import { Input } from 'components/ui/input';
import { useToast } from 'hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const AdminSignInPageClient = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('onSubmit called');
    setLoading(true);
    const result = await signIn('credentials', {
      ...data,
      redirect: false,
    });

    if (result?.ok && !result?.error) {
      toast({
        title: 'Success',
        description: 'Signed in successfully',
      });
      console.log('Sign-in successful, redirecting to /admin');
      router.push('/admin');
    } else {
      console.log('Sign-in failed:', result?.error);
      toast({
        title: 'Error',
        description: result?.error || 'Something went wrong',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <Card className="w-[400px] p-6 rounded-lg border shadow-md mx-4">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-semibold text-center">Admin Sign In</CardTitle>
        <CardDescription className="text-muted-foreground text-center">
          Please enter your credentials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AdminSignInPageClient;