import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get token from request
async function getAuthToken(request: Request) {
  // Get cookies from the request
  const cookieStore = await cookies();
  const sessionTokenName = process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const sessionToken = cookieStore.get(sessionTokenName)?.value;

  console.log('[Schedule API] Cookie name:', sessionTokenName);
  console.log('[Schedule API] Session token exists:', !!sessionToken);

  if (!sessionToken) {
    return null;
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: sessionTokenName,
    });

    console.log('[Schedule API] Token decoded:', token ? 'yes' : 'no');
    console.log('[Schedule API] Token has accessToken:', !!token?.accessToken);

    return token;
  } catch (error) {
    console.error('[Schedule API] Error decoding token:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const token = await getAuthToken(request);

    console.log('[Schedule API] GET - Token:', token ? 'exists' : 'null');

    if (!token?.accessToken) {
      console.log('[Schedule API] GET - Returning 401 - no accessToken');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let url = `${API_URL}/api/schedule`;
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
    const token = await getAuthToken(request);

    console.log('[Schedule API] POST - Token:', token ? 'exists' : 'null');

    if (!token?.accessToken) {
      console.log('[Schedule API] POST - Returning 401 - no accessToken');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/schedule`, {
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
    const token = await getAuthToken(request);

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
      `${API_URL}/api/schedule?startDate=${startDate}&endDate=${endDate}`,
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
