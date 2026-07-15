import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/demo',
  '/demo/(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // If the route is NOT public and user is NOT authenticated, protect it
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  // This matcher tells Next.js which routes to run middleware on
  // It excludes static files, images, etc.
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};