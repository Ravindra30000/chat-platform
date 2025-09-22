import { NextRequest, NextResponse } from "next/server";
import { Contentstack } from "contentstack";

const CLIENT_ID = process.env.CONTENTSTACK_CLIENT_ID!;
const CLIENT_SECRET = process.env.CONTENTSTACK_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // Redirect to Contentstack OAuth
    const authUrl = `https://app.contentstack.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=cm:read cm:write`;

    return NextResponse.redirect(authUrl);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://api.contentstack.io/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
      // Store token securely and redirect to dashboard
      const response = NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard`
      );
      response.cookies.set("contentstack_token", tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return response;
    } else {
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.json(
      { error: "OAuth process failed" },
      { status: 500 }
    );
  }
}
