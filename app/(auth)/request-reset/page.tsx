'use client';

import React, { useState, useEffect } from 'react'; // Import useEffect
import { useSession } from 'next-auth/react'; // Import useSession
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function RequestResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();

  // Redirect authenticated users
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/'); // Redirect to homepage or account page
    }
  }, [status, router]);

  const validateEmail = (email: string) => {
    // Basic email format validation
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'If an account exists for this email, a password reset link has been sent.' });
        toast({
          title: "Success",
          description: data.message || 'If an account exists for this email, a password reset link has been sent.',
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'An error occurred.' });
        toast({
          title: "Error",
          description: data.message || 'An error occurred.',
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessage({ type: 'error', text: (error as Error).message || 'An unexpected error occurred.' });
      toast({
        title: "Error",
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="flex min-h-screen items-center justify-center">
    <Card className="w-[400px] p-6 rounded-lg shadow-md">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-semibold">Forgot Password?</CardTitle>
        <CardDescription className="text-muted-foreground">Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
  );
}