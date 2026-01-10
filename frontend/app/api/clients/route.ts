import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  try {
    const cookieStore = await cookies();
    return {
      accessToken: cookieStore.get('accessToken')?.value || null,
      refreshToken: cookieStore.get('refreshToken')?.value || null,
    };
  } catch {
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
  } catch {
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

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401 && refreshToken) {
    const newAccessToken = await refreshAccessToken(refreshToken);
    if (newAccessToken) {
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return { response: retryResponse, newAccessToken };
    }
  }

  return { response };
}

function setTokenCookie(response: NextResponse, token: string) {
  response.cookies.set('accessToken', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

// GET /api/clients - Get psychologist's clients
export async function GET() {
  try {
    const tokens = await getTokens();

    if (!tokens.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { response, newAccessToken } = await makeAuthenticatedRequest(
      `${API_URL}/api/v1/psychologists/me/clients`,
      { method: 'GET' },
      tokens
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Psychologist profile not found - return empty array
        return NextResponse.json([]);
      }
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    const jsonResponse = NextResponse.json(data);

    if (newAccessToken) {
      setTokenCookie(jsonResponse, newAccessToken);
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
