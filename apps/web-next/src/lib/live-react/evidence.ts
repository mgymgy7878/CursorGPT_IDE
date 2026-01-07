/**
 * Gate C: Telemetry & Evidence
 *
 * Evidence dosyaları: evidence/gateC_live_session.txt, evidence/gateC_cancel.txt, evidence/gateC_dual_panel_single_stream.txt
 */

export interface LiveSessionEvidence {
  requestId: string;
  timestamp: number;
  state: string;
  tokensReceived: number;
  eventsReceived: number;
  streamDurationMs: number;
  lastEventTs: number | null;
  error?: string;
  errorCode?: string;
}

/**
 * Write evidence to file (client-side, localStorage fallback)
 * Gate C: Enhanced logging for smoke tests
 */
export function writeEvidence(
  type: 'live_session' | 'cancel' | 'dual_panel_single_stream',
  data: LiveSessionEvidence
): void {
  if (typeof window === 'undefined') return;

  const filename = `evidence/gateC_${type}.txt`;
  const timestamp = new Date().toISOString();
  const content = `[${timestamp}] ${JSON.stringify(data, null, 2)}\n`;

  // Try to write to localStorage (evidence collection)
  try {
    const key = `evidence_${type}_${data.requestId}`;
    const existing = localStorage.getItem('evidence_collection') || '[]';
    const collection = JSON.parse(existing) as LiveSessionEvidence[];
    collection.push(data);
    localStorage.setItem('evidence_collection', JSON.stringify(collection));
    localStorage.setItem(key, content);

    // Gate C: Also append to evidence file (for smoke tests)
    // Note: Browser security prevents direct file write, but we log to console
    // Manual evidence collection from DevTools Console is required
    console.log(`[Evidence:${type}]`, {
      timestamp,
      filename,
      data,
    });
  } catch (e) {
    console.warn('[Evidence] Failed to write to localStorage:', e);
  }

  // Also log to console for development (enhanced for smoke tests)
  console.log(`[Evidence:${type}]`, data);
  console.log(`[Evidence:${type}] Copy this to evidence/${filename}:`, content);
}

/**
 * Export evidence collection
 */
export function exportEvidence(): string {
  if (typeof window === 'undefined') return '';

  try {
    const collection = localStorage.getItem('evidence_collection');
    if (!collection) return '';

    const data = JSON.parse(collection) as LiveSessionEvidence[];
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.error('[Evidence] Failed to export:', e);
    return '';
  }
}

/**
 * Clear evidence collection
 */
export function clearEvidence(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('evidence_collection');
    // Clear individual evidence keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('evidence_')) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.error('[Evidence] Failed to clear:', e);
  }
}

