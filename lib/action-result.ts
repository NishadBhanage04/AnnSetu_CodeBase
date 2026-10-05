import { isRedirectError } from 'next/dist/client/components/redirect-error';

export type ActionResult<T = void> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

/**
 * Wraps a server action to ensure it always returns an ActionResult.
 * Catches all errors except for Next.js redirect errors, which must be re-thrown
 * to allow the Next.js framework to handle navigation.
 */
export async function safeAction<T>(
  action: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await action();
    return { success: true, data, error: null };
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }

    console.error("Server Action Error:", e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred";
    return { success: false, data: null, error: errorMessage };
  }
}
