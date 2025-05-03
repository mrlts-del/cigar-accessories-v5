'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import useSWR from 'swr';
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Address, AddressType } from "@/types/address";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define and export types for address data
interface ShippingAddressData {
    id?: string; // Optional for new addresses
    type: AddressType;
    name: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal: string;
    country: string;
    phone?: string | null;
}

interface AddressFormProps {
  // Define props if needed, e.g., to pass initial data or handle form submission
  onAddressSelect: (address: ShippingAddressData) => void;
}

export type { ShippingAddressData };

// Schema for address validation
const addressSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(AddressType),
  name: z.string().min(1, "Name is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postal: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional().nullable(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
});

// Helper to format address for display
const formatAddress = (addr: ShippingAddressData | Address) => {
    const name = 'name' in addr ? addr.name : ''; // Handle potential missing 'name' from Prisma Address
    const parts = [name, addr.line1, addr.line2, addr.city, addr.state, addr.postal, addr.country];
    return parts.filter(Boolean).join(', ');
}

const AddressForm: React.FC<AddressFormProps> = ({ onAddressSelect }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id; // Assuming session.user has an id

  const { data: userData, error: userError, isLoading: userLoading } = useSWR<{ addresses: Address[] }>(
    userId ? `/api/users/me` : null, // Fetch user data including addresses if logged in
    fetcher
  );

  const savedAddresses = useMemo(() => userData?.addresses || [], [userData?.addresses]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(true); // Default to showing new address form

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
        type: AddressType.SHIPPING, // Default to shipping address type
        name: session?.user?.name || "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal: "",
        country: "",
        phone: "",
    }
  });

  // Effect to set initial selected address if saved addresses exist
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId && showNewAddressForm) {
      setSelectedAddressId(savedAddresses[0].id);
      setShowNewAddressForm(false);
    }
  }, [savedAddresses, selectedAddressId, showNewAddressForm]);

  // Effect to reset form when switching between saved/new
  useEffect(() => {
    if (showNewAddressForm) {
        form.reset({
            type: AddressType.SHIPPING,
            name: session?.user?.name || "",
            line1: "",
            line2: "",
            city: "",
            state: "",
            postal: "",
            country: "",
            phone: "",
        });
    } else if (selectedAddressId) {
        const selected = savedAddresses.find(a => a.id === selectedAddressId);
        if (selected) {
            form.reset({
                id: selected.id,
                type: selected.type,
                name: session?.user?.name || "Default Name", // Provide default for required name
                line1: selected.line1,
                line2: selected.line2 ?? "",
                city: selected.city,
                state: selected.state,
                postal: selected.postal,
                country: selected.country,
                phone: "", // Assuming phone is not stored in Address model
            });
        }
    }
  }, [selectedAddressId, showNewAddressForm, savedAddresses, form, session]);


  const handleRadioChange = (value: string) => {
      setSelectedAddressId(value);
      setShowNewAddressForm(false);
  };

  const onSubmit: SubmitHandler<AddressFormValues> = (values) => {
    // Pass the selected or new address data up to the parent component
    const submittedData: ShippingAddressData = {
        ...values,
        type: AddressType.SHIPPING // Ensure type is set correctly
    };
    onAddressSelect(submittedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Address</CardTitle>
      </CardHeader>
      <CardContent>
        {userLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!userLoading && userError && (
          <p className="text-red-500">Error loading addresses. Please enter manually.</p>
        )}

        {!userLoading && !userError && userId && savedAddresses.length > 0 && (
          <div className="mb-6">
            <RadioGroup value={selectedAddressId ?? ""} onValueChange={handleRadioChange}>
              <FormLabel className="mb-2 block text-base font-medium">Select Saved Address</FormLabel>
              {savedAddresses.map((address) => (
                <div key={address.id} className="flex items-center space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value={address.id} id={`address-${address.id}`} />
                  <Label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer">
                    {formatAddress(address)} ({address.type})
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button variant="link" className="mt-2 px-0" onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}>
              Enter a new address
            </Button>
          </div>
        )}

        {showNewAddressForm && (
           <>
            {userId && savedAddresses.length > 0 && (
                 <Button variant="link" className="mb-4 px-0" onClick={() => { setShowNewAddressForm(false); setSelectedAddressId(savedAddresses[0]?.id || null); }}>
                   Use saved address
                 </Button>
            )}
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
                      <FormLabel>Address Line 1</FormLabel>
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
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt, suite, etc." {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="postal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
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
                </div>
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                         <Input type="tel" placeholder="555-123-4567" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Hidden field for type, default is handled by schema */}
                <FormField control={form.control} name="type" render={() => <FormItem style={{ display: 'none' }} />} />
              </form>
            </Form>
           </>
        )}

        <div className="flex justify-end mt-6">
          <Button onClick={form.handleSubmit(onSubmit)} disabled={userLoading || form.formState.isSubmitting}>
            Continue to Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressForm;