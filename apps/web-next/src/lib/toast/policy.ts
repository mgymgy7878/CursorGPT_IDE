/**
 * Toast Policy
 * 
 * SHOW TOAST ONLY FOR:
 * 1. User-initiated actions (button clicks)
 * 2. State-changing operations (start/stop/publish)
 * 3. Blocking errors (cannot proceed without user input)
 * 
 * DO NOT SHOW TOAST FOR:
 * 1. Background polling (metrics, status checks)
 * 2. Optional data fetching (sidebar widgets)
 * 3. Executor offline (show amber chip instead)
 * 4. Network errors on non-critical APIs
 */

export function shouldShowToast(context: {
  source: "user_action" | "background_poll" | "page_load";
  type: "success" | "error" | "warning" | "info";
  blocking?: boolean;
}): boolean {
  // Always show toasts for user actions
  if (context.source === "user_action") {
    return true;
  }

  // Show blocking errors regardless of source
  if (context.blocking) {
    return true;
  }

  // Never show toasts for background polling
  if (context.source === "background_poll") {
    return false;
  }

  // Page load: only show blocking errors
  if (context.source === "page_load") {
    return context.type === "error" && !!context.blocking;
  }

  return false;
}

/**
 * Example usage:
 * 
 * // User clicks "Start Strategy" → Toast OK
 * if (shouldShowToast({ source: "user_action", type: "success" })) {
 *   toast({ type: "success", title: "Strategy Started" });
 * }
 * 
 * // Background polling → No toast
 * if (shouldShowToast({ source: "background_poll", type: "error" })) {
 *   // This will be false, no toast shown
 * }
 */

