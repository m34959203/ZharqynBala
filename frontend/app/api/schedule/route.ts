import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get accessToken from cookies - токен сохраняется напрямую в cookie при логине
async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    // Читаем accessToken напрямую из cookies (сохраняется при логине)
    const accessToken = cookieStore.get('accessToken')?.value;

    console.log('[Schedule API] accessToken cookie found:', accessToken ? 'yes' : 'no');

    if (!accessToken) {
      // Логируем все cookies для отладки
      const allCookies = cookieStore.getAll();
      console.log('[Schedule API] All cookies:', allCookies.map(c => c.name).join(', '));
    }

    return accessToken || null;
  } catch (error) {
    console.error('[Schedule API] Error reading accessToken cookie:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const accessToken = await getAccessToken();

    console.log('[Schedule API] GET - accessToken:', accessToken ? 'present' : 'missing');

    if (!accessToken) {
      console.log('[Schedule API] GET - Returning 401 - no accessToken');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let url = `${API_URL}/api/v1/schedule`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    console.log('[Schedule API] GET - Fetching from:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Schedule API] GET - Backend response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        // Профиль психолога не найден - возвращаем пустой массив
        return NextResponse.json([]);
      }
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accessToken = await getAccessToken();

    console.log('[Schedule API] POST - accessToken:', accessToken ? 'present' : 'missing');

    if (!accessToken) {
      console.log('[Schedule API] POST - Returning 401 - no accessToken');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка сохранения' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving schedule:', error);
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const accessToken = await getAccessToken();

    console.log('[Schedule API] DELETE - accessToken:', accessToken ? 'present' : 'missing');

    if (!accessToken) {
      console.log('[Schedule API] DELETE - Returning 401 - no accessToken');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const response = await fetch(
      `${API_URL}/api/v1/schedule?startDate=${startDate}&endDate=${endDate}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка удаления' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
