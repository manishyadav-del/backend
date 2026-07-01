import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function PUT(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  try {
    const body = await request.json();
    const { name, status, tags, listIds } = body;

    // Update subscriber core details
    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: {
        name,
        status,
        tags
      }
    });

    // If lists are provided, manage relationships
    if (listIds && Array.isArray(listIds)) {
      // Clear existing memberships
      await prisma.subscriberListMember.deleteMany({
        where: { subscriberId: id }
      });

      // Insert new memberships
      if (listIds.length > 0) {
        await prisma.subscriberListMember.createMany({
          data: listIds.map(listId => ({
            listId,
            subscriberId: id
          }))
        });
      }
    }

    return NextResponse.json({ success: true, subscriber });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  try {
    await prisma.subscriber.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Subscriber deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
