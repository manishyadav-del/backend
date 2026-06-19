import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

// GET /api/forms/[id] - Get single form submission
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const formSubmission = await prisma.formSubmission.findUnique({
      where: { id },
    });

    if (!formSubmission) {
      return NextResponse.json({ error: 'Form submission not found' }, { status: 404 });
    }

    return NextResponse.json({ formSubmission });
  } catch (error) {
    console.error('Get form submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/forms/[id] - Update form submission
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();
    const { formType, name, email, phone, message, data, status, notes, leadId } = body;

    const formSubmission = await prisma.formSubmission.findUnique({
      where: { id },
    });

    if (!formSubmission) {
      return NextResponse.json({ error: 'Form submission not found' }, { status: 404 });
    }

    const updatedFormSubmission = await prisma.formSubmission.update({
      where: { id },
      data: {
        ...(formType && { formType }),
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(message !== undefined && { message }),
        ...(data !== undefined && { data }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(leadId !== undefined && { leadId }),
      },
    });

    return NextResponse.json({ formSubmission: updatedFormSubmission });
  } catch (error) {
    console.error('Update form submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/forms/[id] - Delete form submission
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    await prisma.formSubmission.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete form submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}