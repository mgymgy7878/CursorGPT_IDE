/**
 * Guardrail confirmation modal for critical actions
 * 
 * @example
 * const ok = await confirm(
 *   'Stratejiyi Sil?',
 *   'Bu işlem geri alınamaz. Strateji tamamen silinecek.'
 * );
 * if (ok) {
 *   // proceed with deletion
 * }
 */
export async function confirm(title: string, detail?: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const div = document.createElement('div');
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-labelledby', 'confirm-title');
    document.body.appendChild(div);

    const cleanup = () => {
      div.remove();
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    // Create modal UI
    div.innerHTML = `
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm grid place-items-center z-[9999] animate-in fade-in duration-200">
        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
          <h3 id="confirm-title" class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            ${title}
          </h3>
          ${detail ? `
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              ${detail}
            </p>
          ` : ''}
          <div class="flex gap-2 justify-end mt-6">
            <button 
              id="confirm-cancel" 
              class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium"
              type="button"
            >
              Vazgeç
            </button>
            <button 
              id="confirm-ok" 
              class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
              type="button"
            >
              Onayla
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    const cancelBtn = div.querySelector('#confirm-cancel') as HTMLButtonElement;
    const okBtn = div.querySelector('#confirm-ok') as HTMLButtonElement;

    cancelBtn?.addEventListener('click', handleCancel);
    okBtn?.addEventListener('click', handleConfirm);

    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Focus OK button by default
    okBtn?.focus();
  });
}

/**
 * Info-only alert (non-blocking)
 */
export function alert(title: string, message?: string): void {
  const div = document.createElement('div');
  document.body.appendChild(div);

  div.innerHTML = `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm grid place-items-center z-[9999] animate-in fade-in duration-200">
      <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">${title}</h3>
        ${message ? `<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">${message}</p>` : ''}
        <div class="flex justify-end mt-6">
          <button 
            id="alert-ok" 
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
            type="button"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  `;

  const okBtn = div.querySelector('#alert-ok') as HTMLButtonElement;
  okBtn?.addEventListener('click', () => div.remove());
  okBtn?.focus();
}

