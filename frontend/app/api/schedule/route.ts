import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get tokens from cookies
async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  try {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get('accessToken')?.value || null;
    const refreshToken = cookieStore.get('refreshToken')?.value || null;

    console.log('[Schedule API] accessToken cookie found:', accessToken ? 'yes' : 'no');
    console.log('[Schedule API] refreshToken cookie found:', refreshToken ? 'yes' : 'no');

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('[Schedule API] Error reading cookies:', error);
    return { accessToken: null, refreshToken: null };
  }
}

// Helper to refresh access token
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    console.log('[Schedule API] Attempting to refresh access token...');

    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.error('[Schedule API] Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[Schedule API] Token refreshed successfully');
    return data.accessToken;
  } catch (error) {
    console.error('[Schedule API] Error refreshing token:', error);
    return null;
  }
}

// Helper to make authenticated request with retry on 401
async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit,
  tokens: { accessToken: string | null; refreshToken: string | null }
): Promise<{ response: Response; newAccessToken?: string }> {
  const { accessToken, refreshToken } = tokens;

  if (!accessToken) {
    throw new Error('No access token');
  }

  // First attempt with current access token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('[Schedule API] Backend response status:', response.status);

  // If 401 and we have refresh token, try to refresh
  if (response.status === 401 && refreshToken) {
    console.log('[Schedule API] Got 401, attempting token refresh...');

    const newAccessToken = await refreshAccessToken(refreshToken);

    if (newAccessToken) {
      // Retry with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Schedule API] Retry response status:', retryResponse.status);
      return { response: retryResponse, newAccessToken };
    }
  }

  return { response };
}

export async function GET(request: Request) {
  try {
    const tokens = await getTokens();

    console.log('[Schedule API] GET - accessToken:', tokens.accessToken ? 'present' : 'missing');

    if (!tokens.accessToken) {
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

    const { response, newAccessToken } = await makeAuthenticatedRequest(url, { method: 'GET' }, tokens);

    if (!response.ok) {
      if (response.status === 404) {
        // Профиль психолога не найден - возвращаем пустой массив
        return NextResponse.json([]);
      }
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    const jsonResponse = NextResponse.json(data);

    // If token was refreshed, update the cookie
    if (newAccessToken) {
      jsonResponse.cookies.set('accessToken', newAccessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tokens = await getTokens();

    console.log('[Schedule API] POST - accessToken:', tokens.accessToken ? 'present' : 'missing');

    if (!tokens.accessToken) {
      console.log('[Schedule API] POST - Returning 401 - no accessToken');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { response, newAccessToken } = await makeAuthenticatedRequest(
      `${API_URL}/api/v1/schedule`,
      { method: 'POST', body: JSON.stringify(body) },
      tokens
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка сохранения' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    const jsonResponse = NextResponse.json(data);

    // If token was refreshed, update the cookie
    if (newAccessToken) {
      jsonResponse.cookies.set('accessToken', newAccessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error saving schedule:', error);
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const tokens = await getTokens();

    console.log('[Schedule API] DELETE - accessToken:', tokens.accessToken ? 'present' : 'missing');

    if (!tokens.accessToken) {
      console.log('[Schedule API] DELETE - Returning 401 - no accessToken');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const { response, newAccessToken } = await makeAuthenticatedRequest(
      `${API_URL}/api/v1/schedule?startDate=${startDate}&endDate=${endDate}`,
      { method: 'DELETE' },
      tokens
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка удаления' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    const jsonResponse = NextResponse.json(data);

    // If token was refreshed, update the cookie
    if (newAccessToken) {
      jsonResponse.cookies.set('accessToken', newAccessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
