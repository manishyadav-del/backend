import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';

const FRONTEND_API_URL = 'http://localhost:3001/api/dashboard/admin/manage-users';
const SYNC_SECRET = 'your-super-secret-key';

async function fetchFrontend(method, body = null, id = null) {
  let url = FRONTEND_API_URL;
  if (id && method === 'DELETE') {
    url += `?id=${id}`;
  }
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-sync-secret': SYNC_SECRET,
    },
  };
  if (body && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to call frontend API');
  }
  return res.json();
}

export async function GET(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await fetchFrontend('GET');
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = await fetchFrontend('POST', body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data = await fetchFrontend('PUT', body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await fetchFrontend('DELETE', null, id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
