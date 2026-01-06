import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  console.log("[Debug:test-login] ========== Test Login Started ==========");

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("[Debug:test-login] Email:", email);
    console.log("[Debug:test-login] API_URL:", API_URL);

    const apiUrl = `${API_URL}/api/v1/auth/login`;
    console.log("[Debug:test-login] Full API URL:", apiUrl);

    console.log("[Debug:test-login] Making fetch request...");
    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const duration = Date.now() - startTime;
    console.log("[Debug:test-login] Response received in", duration, "ms");
    console.log("[Debug:test-login] Status:", response.status);
    console.log("[Debug:test-login] StatusText:", response.statusText);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("[Debug:test-login] Headers:", headers);

    const responseText = await response.text();
    console.log("[Debug:test-login] Response body length:", responseText.length);
    console.log("[Debug:test-login] Response body (first 1000 chars):", responseText.substring(0, 1000));

    let jsonData = null;
    let parseError = null;
    try {
      jsonData = JSON.parse(responseText);
    } catch (e: any) {
      parseError = e.message;
    }

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      headers,
      responseLength: responseText.length,
      isJson: !!jsonData,
      parseError,
      data: jsonData
        ? {
            hasUser: !!jsonData.user,
            hasAccessToken: !!jsonData.accessToken,
            hasRefreshToken: !!jsonData.refreshToken,
            user: jsonData.user
              ? {
                  id: jsonData.user.id,
                  email: jsonData.user.email,
                  role: jsonData.user.role,
                }
              : null,
          }
        : null,
      rawResponse: responseText.substring(0, 500),
    };

    console.log("[Debug:test-login] ========== Test Login Complete ==========");
    console.log("[Debug:test-login] Result:", JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Debug:test-login] ========== ERROR ==========");
    console.error("[Debug:test-login] Error name:", error.name);
    console.error("[Debug:test-login] Error message:", error.message);
    console.error("[Debug:test-login] Error stack:", error.stack);

    return NextResponse.json(
      {
        success: false,
        error: {
          name: error.name,
          message: error.message,
          cause: error.cause?.message,
        },
      },
      { status: 500 }
    );
  }
}
