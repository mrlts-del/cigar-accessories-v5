'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useParams, notFound } from 'next/navigation';
import axios from 'axios';

interface OrderDetails {
  id: string;
  status: string;
  // Add other fields as necessary
}

const fetchOrderDetails = async ({ queryKey }: { queryKey: [string, string] }): Promise<OrderDetails> => {
  const [, orderId] = queryKey;
  const { data } = await axios.get(`/api/orders/${orderId}`);
  return data;
};

export default function OrderDetailPage() {
  const { status } = useSession({ required: true });
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['orderDetails', orderId],
    queryFn: fetchOrderDetails,
    enabled: status === 'authenticated' && !!orderId,
    retry: false,
  });

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return <div>Loading...</div>;
  }

  if (isError) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }
    return <p className="text-red-500">Error loading order: {error.message}</p>;
  }

  if (!order) {
    return <p>Order not found.</p>;
  }

  return (
    <div>
      <h1>Order Details</h1>
      <p>Order ID: {order.id}</p>
      <p>Status: {order.status}</p>
    </div>
  );
}