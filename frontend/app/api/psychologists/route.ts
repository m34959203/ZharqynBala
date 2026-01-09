import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const specialization = searchParams.get('specialization');

    let url = `${API_URL}/api/v1/psychologists?page=${page}&limit=${limit}`;
    if (specialization) {
      url += `&specialization=${encodeURIComponent(specialization)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching psychologists:', error);
    return NextResponse.json({ error: 'Failed to fetch psychologists' }, { status: 500 });
  }
}
