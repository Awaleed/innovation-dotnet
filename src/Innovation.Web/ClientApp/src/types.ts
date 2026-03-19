/**
 * Shared types for Inertia pages.
 *
 * Shared props (auth.user) are declared globally in global.d.ts
 * via Inertia v2 declaration merging — they're available on every page
 * automatically via usePage().props.auth.user.
 *
 * Page-specific prop types go below.
 */

// Re-export for convenience
export interface AuthUser {
    id: string;
    name: string;
    email: string;
}

// Page-specific props — add more as pages are created
export interface DashboardProps {
    // Currently uses only shared auth props
}

export interface WelcomeProps {
    // Public page, no extra props
}
