export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protège toutes les routes sauf :
     * - /login
     * - /api/auth (NextAuth)
     * - /_next (assets Next.js)
     * - fichiers statiques
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
