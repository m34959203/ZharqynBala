import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(`${API_URL}/api/v1/psychologists/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Психолог не найден' }, { status: 404 });
      }
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching psychologist:', error);
    return NextResponse.json({ error: 'Failed to fetch psychologist' }, { status: 500 });
  }
}
