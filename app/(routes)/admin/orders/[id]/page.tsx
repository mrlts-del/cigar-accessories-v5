import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    return null; 
  }

  const isAdmin = session?.user?.role === 'ADMIN';
  const isOwner = session?.user && order.userId === session.user.id;

  if (!isAdmin && !isOwner) {
    throw new Error("Forbidden"); 
  }

  // ... rest of the component code ...
}