import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get token from cookies - читаем cookie напрямую через next/headers
async function getAuthToken() {
  try {
    const cookieStore = await cookies();

    // Пробуем оба варианта имени cookie
    const secureCookieName = '__Secure-next-auth.session-token';
    const normalCookieName = 'next-auth.session-token';

    let sessionToken = cookieStore.get(secureCookieName)?.value;
    let usedCookieName = secureCookieName;

    if (!sessionToken) {
      sessionToken = cookieStore.get(normalCookieName)?.value;
      usedCookieName = normalCookieName;
    }

    console.log('[Schedule API] Cookie name used:', usedCookieName);
    console.log('[Schedule API] Session token found:', sessionToken ? 'yes' : 'no');

    // Логируем все доступные cookies для отладки
    const allCookies = cookieStore.getAll();
    console.log('[Schedule API] All cookies:', allCookies.map(c => c.name).join(', '));

    if (!sessionToken) {
      console.log('[Schedule API] No session token cookie found');
      return null;
    }

    // Декодируем JWT токен
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    console.log('[Schedule API] Token decoded:', token ? 'yes' : 'no');
    console.log('[Schedule API] Token keys:', token ? Object.keys(token) : 'null');
    console.log('[Schedule API] Token accessToken:', token?.accessToken ? 'present' : 'missing');

    return token;
  } catch (error) {
    console.error('[Schedule API] Error decoding token:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const token = await getAuthToken();

    console.log('[Schedule API] GET - Token:', token ? 'exists' : 'null');

    if (!token?.accessToken) {
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
        'Authorization': `Bearer ${token.accessToken}`,
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
    const token = await getAuthToken();

    console.log('[Schedule API] POST - Token:', token ? 'exists' : 'null');

    if (!token?.accessToken) {
      console.log('[Schedule API] POST - Returning 401 - no accessToken');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
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
    const token = await getAuthToken();

    if (!token?.accessToken) {
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
          'Authorization': `Bearer ${token.accessToken}`,
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
