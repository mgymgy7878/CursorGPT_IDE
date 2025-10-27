export function useToast() {
  return {
    success: (msg: string, opts?: any) =>
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { type: 'success', message: msg, ...opts },
        })
      ),
    error: (msg: string, opts?: any) =>
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { type: 'error', message: msg, ...opts },
        })
      ),
  };
}

