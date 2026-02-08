import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenResponse = await fetch(
    "https://eu-west-2f6mdhutkp.auth.eu-west-2.amazoncognito.com/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: "26st86eirq4i8986hmheb4m1ll",
        code,
        redirect_uri: "https://dashboard.ingeniumdesigns.co.uk/parse-auth",
      }),
    }
  );

  const tokens = await tokenResponse.json();

  const res = NextResponse.redirect("https://dashboard.ingeniumdesigns.co.uk");

  res.cookies.set("ingenium-id-token", tokens.id_token, {
    httpOnly: true,
    secure: true,
    path: "/",
  });

  res.cookies.set("ingenium-access-token", tokens.access_token, {
    httpOnly: true,
    secure: true,
    path: "/",
  });

  res.cookies.set("ingenium-refresh-token", tokens.refresh_token, {
    httpOnly: true,
    secure: true,
    path: "/",
  });

  return res;
}