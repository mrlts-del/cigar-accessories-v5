// Client-side authentication component for login and registration
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from 'components/ui/form';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { Separator } from 'components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';

// Update form schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Valid email required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name required" }),
  email: z.string().email({ message: "Valid email required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const LoginClient = () => {
  const router = useRouter();
  const { toast } = useToast();

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Registration form
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    // Get callbackUrl from query params or determine based on pathname
    const pathname = window.location.pathname;
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')
      || (pathname.startsWith('/admin') ? '/admin' : '/');

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false, // Prevent automatic redirect by signIn
      });
      console.log('Sign-in result:', result);

      if (result?.error) {
        setError(result.error);
        toast({
          title: 'Login Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result?.ok) {
        toast({
          title: 'Login Successful',
          description: 'Redirecting...',
        });
        router.push(callbackUrl);
        console.log('Navigation initiated to', callbackUrl);

        if (callbackUrl === '/admin') {
          setTimeout(() => {
            if (window.location.pathname !== '/admin') {
              window.location.href = '/admin';
            }
          }, 500);
        }
      } else {
        toast({
          title: 'Login Failed',
          description: 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        title: 'Login Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      console.log('Login process completed');
    }
  };

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsRegistering(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      if (response.ok) {
        toast({
          title: 'Registration Successful',
          description: 'Your account has been created.',
        });
        
        const signInResult = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        });
        
        if (signInResult?.ok) {
          router.push('/');
        } else {
          const loginTabTrigger = document.querySelector('button[role="tab"][data-state="inactive"][data-value="login"]');
          if (loginTabTrigger instanceof HTMLElement) {
            loginTabTrigger.click();
          } else {
            const genericLoginTabTrigger = Array.from(document.querySelectorAll('button[role="tab"]')).find(el => el.textContent?.toLowerCase().includes('login'));
            if (genericLoginTabTrigger instanceof HTMLElement) {
              genericLoginTabTrigger.click();
            }
          }
        }
      } else {
        let errorMessage = 'Something went wrong';
        const clonedResponse = response.clone();

        try {
          // Attempt to parse the original response as JSON
          const data = await response.json();
          errorMessage = data.message || JSON.stringify(data) || errorMessage;
        } catch (jsonError) {
          console.error('Failed to parse API error response as JSON:', jsonError);
          // If JSON parsing fails, attempt to read the cloned response as text
          try {
            const textResponse = await clonedResponse.text();
            errorMessage = textResponse || errorMessage;
          } catch (textError) {
            console.error('Failed to get API error response as text from cloned response:', textError);
            // Keep the default error message if text parsing also fails
          }
        }
        toast({
          title: 'Registration Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.log('Full registration error object:', error);
      let description = 'An unexpected error occurred. Check the console for details.';
      if (error instanceof Error) {
        description = `${error.name}: ${error.message}. Check the console for more details.`;
      }
      toast({
        title: 'Registration Error',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="w-[400px] p-6 rounded-lg border shadow-md mx-4">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">Sign In</CardTitle>
        <CardDescription className="text-muted-foreground text-center">Welcome back</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
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
                <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">Sign in</Button>
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
                <Separator />
                <Button type="button" onClick={() => signIn('google')} className="w-full border">Sign in with Google</Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="register">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
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
                <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">
                  {isRegistering ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LoginClient;