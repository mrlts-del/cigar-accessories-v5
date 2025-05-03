"use client";

import React, { useState } from 'react'; // Import React and useState
import { signIn, useSession } from 'next-auth/react'; // Import signIn and useSession
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { useToast } from "@/hooks/use-toast";
import zxcvbn from 'zxcvbn'; // Import zxcvbn

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'Login' | 'Register'>('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0); // State for password strength score
  const [passwordFeedback, setPasswordFeedback] = useState(''); // State for password feedback text
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { toast } = useToast();
  const { status } = useSession();
  const router = useRouter();

  // Redirect authenticated users
  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/'); // Redirect to homepage or account page
    }
  }, [status, router]);

  const handleTabSwitch = (tab: 'Login' | 'Register') => {
    setActiveTab(tab);
    setMessage(null); // Clear messages on tab switch
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const validateEmail = (email: string) => {
    // Basic email format validation
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false, // Prevent automatic redirect
        email,
        password,
      });

      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setMessage({ type: 'success', text: 'Login successful!' });
        toast({
          title: "Success",
          description: "Login successful!",
        });
        // Redirect handled by useEffect after session status updates
      }
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setMessage({ type: 'error', text: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Registration successful! Please log in.' });
        toast({
          title: "Success",
          description: "Registration successful! Please log in.",
        });
        setActiveTab('Login'); // Switch to login tab after successful registration
      } else {
        setMessage({ type: 'error', text: data.error || 'Registration failed.' });
        toast({
          title: "Error",
          description: data.error || 'Registration failed.',
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setMessage({ type: 'error', text: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-[400px] overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{activeTab === 'Login' ? 'Sign In' : 'Register'}</CardTitle>
          <CardDescription>{activeTab === 'Login' ? 'Welcome back' : 'Create a new account'}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              className={`flex-1 text-center py-2 border-b-2 ${activeTab === 'Login' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
              onClick={() => handleTabSwitch('Login')}
            >
              Login
            </button>
            <button
              className={`flex-1 text-center py-2 border-b-2 ${activeTab === 'Register' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
              onClick={() => handleTabSwitch('Register')}
            >
              Register
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {/* Forms */}
          {activeTab === 'Login' ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="/request-reset" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (activeTab === 'Register') {
                      const result = zxcvbn(e.target.value);
                      setPasswordStrength(result.score);
                      setPasswordFeedback(result.feedback.suggestions.join(' ') || result.feedback.warning || '');
                    }
                  }}
                  required
                />
                {/* Password Strength Indicator */}
                {activeTab === 'Register' && password.length > 0 && (
                  <div className="mt-2">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          passwordStrength === 0 ? 'bg-red-500 w-1/5' :
                          passwordStrength === 1 ? 'bg-orange-500 w-2/5' :
                          passwordStrength === 2 ? 'bg-yellow-500 w-3/5' :
                          passwordStrength === 3 ? 'bg-green-500 w-4/5' :
                          'bg-green-600 w-full'
                        }`}
                        style={{ width: `${(passwordStrength + 1) * 20}%` }} // Visual bar width
                      ></div>
                    </div>
                    <p className={`text-sm mt-1 ${
                      passwordStrength === 0 ? 'text-red-700' :
                      passwordStrength === 1 ? 'text-orange-700' :
                      passwordStrength === 2 ? 'text-yellow-700' :
                      passwordStrength === 3 ? 'text-green-700' :
                      'text-green-800'
                    }`}>
                      Strength: {passwordStrength === 0 ? 'Very Weak' :
                                 passwordStrength === 1 ? 'Weak' :
                                 passwordStrength === 2 ? 'Fair' :
                                 passwordStrength === 3 ? 'Good' :
                                 'Strong'}
                    </p>
                    {passwordFeedback && <p className="text-xs text-gray-600 mt-1">{passwordFeedback}</p>}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          )}

          {/* Separator */}
          <div className="divider-container flex items-center my-6 w-full">
            <div className="divider-line flex-grow h-px bg-gray-200"></div>
            <span className="divider-text px-4 text-sm text-gray-500 text-center whitespace-nowrap">OR CONTINUE WITH</span>
            <div className="divider-line flex-grow h-px bg-gray-200"></div>
          </div>

          {/* Social Login */}
          <Button variant="outline" className="w-full" onClick={() => signIn('google', { callbackUrl: '/' })}>
            {/* Google Icon Placeholder */}
            <svg className="mr-2 h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19"><path fill-rule="evenodd" d="M8.842 18.083A8.8 8.8 0 0 1 8.77 18h.06c.933 0 1.714-.097 2.414-.307a8.9 8.9 0 0 1 3.763-2.953l-.027-.027A9.2 9.2 0 0 0 17 11.617V11h-.003A8.9 8.9 0 0 0 13.582 1.56l-.002-.002h-.006l-.017-.006-.007-.004-.021-.001a8.9 8.9 0 0 0-4.5-.982 8.8 8.8 0 0 0-8.316 8.8c0 4.08.304 4.326 2.913 7.465l.015.015c.331.331.66.661.991.99l3.502 3.502Zm-.317-5.614V7.205h1.654a4.5 4.5 0 0 1 1.133.038 3.1 3.1 0 0 1 2.244.8l.015.015c.794.794.924 1.845.924 2.969 0 1.123-.13 2.174-.924 2.968l-.015.015a3.1 3.1 0 0 1-2.244.8 4.5 4.5 0 0 1-1.133.038h-1.654Zm-6.604 2.1c-1.4-.9-2.355-2.183-2.355-3.582 0-1.399.955-2.682 2.355-3.581l-.002-.002c-.001-.001-.003-.003-.004-.004A8.8 8.8 0 0 0 1 8.999a8.9 8.9 0 0 0 8.316 8.8c-.741.016-1.477-.03-2.199-.139l-.002-.002Zm-.002-.002Z" clip-rule="evenodd"></path></svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}