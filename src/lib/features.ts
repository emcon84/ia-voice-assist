/**
 * Feature flags for toggling between JSON data and Database
 * 
 * Usage in code:
 * import { useFeatures } from '@/lib/features';
 * 
 * const { USE_DATABASE } = useFeatures();
 * if (USE_DATABASE) {
 *   // Fetch from API
 * } else {
 *   // Use JSON data
 * }
 */

export const features = {
  /**
   * Toggle between JSON data and PostgreSQL database
   * false = use JSON data (current behavior)
   * true = use database (new behavior)
   */
  USE_DATABASE: process.env.NEXT_PUBLIC_USE_DATABASE === 'true',

  /**
   * Enable Stripe payments
   * Must have STRIPE_SECRET_KEY configured
   */
  ENABLE_PAYMENTS: !!process.env.STRIPE_SECRET_KEY,

  /**
   * Enable AI-assisted content creation in admin panel
   * Must have GROQ_API_KEY configured
   */
  ENABLE_AI_ASSISTANT: !!process.env.GROQ_API_KEY,
} as const;

export type FeatureFlags = typeof features;

/**
 * Hook-like function for usage in components
 * Note: This checks env vars at build/runtime - not reactive
 */
export function useFeatures() {
  return features;
}

/**
 * Server-side feature check
 */
export function getFeatures(): FeatureFlags {
  return features;
}

/**
 * Check if a specific feature is enabled
 */
export function hasFeature<K extends keyof FeatureFlags>(
  feature: K
): boolean {
  return features[feature];
}