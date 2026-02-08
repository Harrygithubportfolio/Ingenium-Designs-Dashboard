import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COGNITO_DOMAIN = "https://eu-west-2f6mdhutkp.auth.eu-west-2.amazoncognito.com";
const CLIENT_ID = "26st86eirq4i8986hmheb4m1ll";
const REDIRECT_URI = "https://dashboard.ingeniumdesigns.co.uk/parse-auth";

export function middleware(req: NextRequest) {
  const idToken = req.cookies.get("ingenium-id-token")?.value;
  const accessToken = req.cookies.get("ingenium-access-token")?.value;

  // Allow the callback route
  if (req.nextUrl.pathname === "/parse-auth") {
    return NextResponse.next();
  }

  // If authenticated → continue
  if (idToken && accessToken) {
    return NextResponse.next();
  }

  // Otherwise → redirect to Cognito login
  const loginUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=openid+email+profile&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}`;

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public).*)"],
};