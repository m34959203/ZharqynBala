import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value || null;
    const refreshToken = cookieStore.get('refreshToken')?.value || null;
    return { accessToken, refreshToken };
  } catch (error) {
    return { accessToken: null, refreshToken: null };
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    return null;
  }
}

async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit,
  tokens: { accessToken: string | null; refreshToken: string | null }
): Promise<{ response: Response; newAccessToken?: string }> {
  const { accessToken, refreshToken } = tokens;

  if (!accessToken) {
    throw new Error('No access token');
  }

  // Первая попытка
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Если 401 и есть refreshToken, пробуем обновить токен
  if (response.status === 401 && refreshToken) {
    const newAccessToken = await refreshAccessToken(refreshToken);

    if (newAccessToken) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });

      return { response, newAccessToken };
    }
  }

  return { response };
}

export async function GET() {
  try {
    const tokens = await getTokens();

    if (!tokens.accessToken) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { response, newAccessToken } = await makeAuthenticatedRequest(
      `${API_URL}/api/v1/psychologists/me`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      },
      tokens
    );

    const data = await response.json();

    const nextResponse = response.ok
      ? NextResponse.json(data)
      : NextResponse.json(data, { status: response.status });

    if (newAccessToken) {
      nextResponse.cookies.set('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Error fetching psychologist profile:', error);
    return NextResponse.json({ error: 'Ошибка загрузки профиля' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const tokens = await getTokens();

    if (!tokens.accessToken) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();

    const { response, newAccessToken } = await makeAuthenticatedRequest(
      `${API_URL}/api/v1/psychologists/me`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      tokens
    );

    const data = await response.json();

    const nextResponse = response.ok
      ? NextResponse.json(data)
      : NextResponse.json(data, { status: response.status });

    if (newAccessToken) {
      nextResponse.cookies.set('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Error updating psychologist profile:', error);
    return NextResponse.json({ error: 'Ошибка обновления профиля' }, { status: 500 });
  }
}
