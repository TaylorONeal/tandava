/** Preserve a safe endpoint explanation instead of showing an HTTP status error. */
export async function apiErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  if (error.context instanceof Response) {
    try {
      const body: unknown = await error.context.clone().json();
      if (body && typeof body === 'object' && 'error' in body
          && typeof body.error === 'string' && body.error.trim().length > 0 && body.error.length <= 500) {
        return body.error;
      }
    } catch { /* Keep the SDK message for missing or unreadable response bodies. */ }
  }
  return error.message;
}
