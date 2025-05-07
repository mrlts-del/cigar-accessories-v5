'use client';

import React, { Suspense } from 'react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Container from '@/components/ui/container';
import Heading from '@/components/ui/heading';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

// Define FAQ type
interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  leave_blank: z.string().optional(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required'), // Add reCAPTCHA token field
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPageClient = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const { data: faqs, isLoading, error } = useSWR<FAQ[]>('/api/faqs');

  if (error) {
    console.error('Error fetching FAQs:', error);
  }

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token');
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        const data = await response.json();
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
          setValue('csrfToken', data.csrfToken);
        } else {
          throw new Error('CSRF token not found in response');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
        // Optionally, you can set an error state or disable the form here
      }
    };
    fetchCsrfToken();
  }, [setValue]);

  const onSubmit = async (data: ContactFormValues) => {
    try {
      if (!executeRecaptcha) {
        toast({ description: 'reCAPTCHA not available', variant: 'destructive' });
        return;
      }

      const token = await executeRecaptcha('contactForm');
      if (!token) {
        toast({ description: 'Failed to get reCAPTCHA token', variant: 'destructive' });
        return;
      }

      const submissionData = {
        ...data,
        recaptchaToken: token,
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        toast({ description: 'Thank you for reaching out. We\'ll respond as soon as possible.' });
      } else {
        toast({ description: 'Submission failed. Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ description: 'An error occurred. Please try again.', variant: 'destructive' });
    }
  };


return (
      <Container className="py-12">
        <Card>
          <CardHeader>
            <Heading title="Get in Touch" description="Contact us for any inquiries" />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            type="hidden"
            {...register('csrfToken')}
            value={csrfToken ?? ''}
          />
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Name"
              {...register('name')}
            />
            {errors.name && <p>{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              {...register('email')}
            />
            {errors.email && <p>{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Subject"
              {...register('subject')}
            />
            {errors.subject && <p>{errors.subject.message}</p>}
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              placeholder="Message"
              className="w-full p-2 border rounded-md"
              {...register('message')}
            />
            {errors.message && <p>{errors.message.message}</p>}
          </div>
            <Button type="submit" disabled={isSubmitting || !csrfToken} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
            <p className="text-sm text-gray-300 mt-4 text-center">
              We typically respond within 24 business hours.
            </p>
            <p className="text-sm text-gray-300 mt-2 text-center">
              <a href="/privacy-policy" className="underline hover:text-amber-500">
                Read our Privacy Policy
              </a>
            </p>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <Heading title="Frequently Asked Questions" description="Get answers to common questions" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton />
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs?.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8 bg-gray-800 text-white">
        <CardHeader>
          <Heading title="Why Choose Us" description="" className="text-white" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="text-amber-500 text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Secure Checkout</h3>
              <p className="text-gray-300">Your information is protected by SSL encryption.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-amber-500 text-4xl mb-4">💳</div>
              <h3 className="text-lg font-semibold mb-2">Accepted Payments</h3>
              <p className="text-gray-300">Visa, MasterCard, Apple Pay, LinePay, JKO Pay</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-amber-500 text-4xl mb-4">🚚</div>
              <h3 className="text-lg font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-300">Free shipping on all orders above 3000</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
};

const ContactPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactPageClient />
    </Suspense>
  );
};

export default ContactPage;
