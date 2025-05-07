import type { StoreSetting } from '@/types/settings';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// GET /api/admin/settings - Fetch all settings
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings: StoreSetting[] = await prisma.storeSetting.findMany();
    const settingsObject = settings.reduce((acc: Record<string, string>, setting: StoreSetting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PATCH /api/admin/settings - Update multiple settings (upsert)
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updates: { key: string; value: string }[] = Object.entries(body).map(
      ([key, value]) => ({ key, value: String(value) })
    );

    if (!updates.length) {
      return NextResponse.json({ error: 'No settings provided for update' }, { status: 400 });
    }

    const transactionPromises = updates.map(setting =>
      prisma.storeSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    );

    await prisma.$transaction(transactionPromises);

    const updatedSettings: StoreSetting[] = await prisma.storeSetting.findMany();
    const settingsObject = updatedSettings.reduce((acc: Record<string, string>, setting: StoreSetting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}