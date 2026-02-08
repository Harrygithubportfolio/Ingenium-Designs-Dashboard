import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COGNITO_DOMAIN = "https://eu-west-2s533x2p21.auth.eu-west-2.amazoncognito.com";
const CLIENT_ID = "7r3sa4mqqamdrd8idrrtu89g95";
const REDIRECT_URI = "https://dashboard.ingeniumdesigns.co.uk";

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
    REDIRECT_URI + "/parse-auth"
  )}`;

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public).*)"],
};