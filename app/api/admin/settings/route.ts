import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if needed
import { prisma } from '@/lib/prisma';
import { UserRole, StoreSetting } from '@prisma/client'; // Re-add StoreSetting type import

// GET /api/admin/settings - Fetch all settings
export async function GET() { // Removed unused request parameter
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings: StoreSetting[] = await prisma.storeSetting.findMany(); // Explicitly type settings
    // Convert array of {key, value} to a single object {key1: value1, key2: value2}
    const settingsObject = settings.reduce((acc: Record<string, string>, setting: StoreSetting) => { // Explicitly type setting
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

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updates: { key: string; value: string }[] = Object.entries(body).map(
      ([key, value]) => ({ key, value: String(value) }) // Ensure value is string
    );

    if (!updates.length) {
      return NextResponse.json({ error: 'No settings provided for update' }, { status: 400 });
    }

    // Use Prisma transaction to upsert multiple settings
    const transactionPromises = updates.map(setting =>
      prisma.storeSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    );

    await prisma.$transaction(transactionPromises);

    // Fetch the updated settings to return
    const updatedSettings: StoreSetting[] = await prisma.storeSetting.findMany(); // Explicitly type updatedSettings
    const settingsObject = updatedSettings.reduce((acc: Record<string, string>, setting: StoreSetting) => { // Explicitly type setting
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);


    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error('Failed to update settings:', error);
    // Consider more specific error handling (e.g., validation errors)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}