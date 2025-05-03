export enum AddressType {
  SHIPPING = 'SHIPPING',
  BILLING = 'BILLING',
}

export interface Address {
  id: string;
  name: string; // Added name property
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal: string;
  country: string;
  type: AddressType;
  // Add other fields if used by AddressForm.tsx
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}