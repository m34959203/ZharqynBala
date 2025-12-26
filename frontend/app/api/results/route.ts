import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const childId = searchParams.get('childId');

    let url = `${API_URL}/api/v1/results?limit=${limit}`;
    if (childId) {
      url = `${API_URL}/api/v1/results/child/${childId}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await response.json();
    return NextResponse.json({ results: Array.isArray(data) ? data : data.results || [] });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ results: [] });
  }
}
