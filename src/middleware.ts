import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard') ||
        req.nextUrl.pathname.startsWith('/admin') ||
        req.nextUrl.pathname.startsWith('/trainer') ||
        req.nextUrl.pathname.startsWith('/employee')
    const isOnLogin = req.nextUrl.pathname.startsWith('/login')

    // Create response
    let response: NextResponse;

    if (isOnDashboard) {
        if (isLoggedIn) {
            response = NextResponse.next();
        } else {
            response = NextResponse.redirect(new URL('/login', req.nextUrl));
        }
    } else if (isOnLogin) {
        if (isLoggedIn) {
            response = NextResponse.redirect(new URL('/dashboard', req.nextUrl));
        } else {
            response = NextResponse.next();
        }
    } else {
        response = NextResponse.next();
    }

    // Add security headers to all responses
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|sw.js|manifest.json).*)'],
}
