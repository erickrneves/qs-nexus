// Client-side auth utilities
// This file should NOT import any server-only modules like db, postgres, etc.

export async function signOut(options?: { redirectTo?: string }) {
  // Call the NextAuth signOut API route
  await fetch('/api/auth/signout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  // Redirect after signout
  const redirectTo = options?.redirectTo || '/login'
  window.location.href = redirectTo
}
