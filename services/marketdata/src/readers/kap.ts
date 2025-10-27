// services/marketdata/src/readers/kap.ts
// KAP (Kamuyu Aydınlatma Platformu) Reader
// MKK tarafından işletilen resmi bildirim platformu

export interface KAPDisclosure {
  id: string;
  title: string;
  company: string;
  date: string;
  type: string;
  url: string;
  summary?: string;
}

const KAP_BASE = 'https://www.kap.org.tr';

/**
 * Fetch KAP disclosures list
 * 
 * @param params Filter parameters (from, to, company, etc.)
 * @returns Array of KAP disclosures
 * 
 * Note: Bu MVP implementasyonu basit HTML parsing kullanıyor.
 * Production'da KAP'ın resmi API'si veya daha güvenilir veri kaynağı kullanılmalı.
 */
export async function fetchKAPList(params: {
  from?: string;
  to?: string;
  company?: string;
  type?: string;
} = {}): Promise<KAPDisclosure[]> {
  try {
    console.log('[KAP] Fetching disclosures with params:', params);

    // TODO: KAP'ın resmi API'sini kullan
    // Şu an için mock data dönüyoruz
    const mockDisclosures: KAPDisclosure[] = [
      {
        id: 'kap-001',
        title: 'THYAO - Finansal Tablolar ve Faaliyet Raporu',
        company: 'THYAO',
        date: new Date().toISOString(),
        type: 'Finansal Tablo',
        url: `${KAP_BASE}/tr/Bildirim/123456`,
        summary: '2024 Q3 finansal sonuçları',
      },
      {
        id: 'kap-002',
        title: 'AKBNK - Temettü Dağıtım Kararı',
        company: 'AKBNK',
        date: new Date(Date.now() - 3600000).toISOString(),
        type: 'Temettü',
        url: `${KAP_BASE}/tr/Bildirim/123457`,
        summary: 'Brüt 0.50 TL temettü dağıtımı',
      },
      {
        id: 'kap-003',
        title: 'GARAN - Özel Durum Açıklaması',
        company: 'GARAN',
        date: new Date(Date.now() - 7200000).toISOString(),
        type: 'Özel Durum',
        url: `${KAP_BASE}/tr/Bildirim/123458`,
        summary: 'Stratejik ortaklık anlaşması',
      },
      {
        id: 'kap-004',
        title: 'ISCTR - Pay Geri Alım Programı',
        company: 'ISCTR',
        date: new Date(Date.now() - 10800000).toISOString(),
        type: 'Pay Geri Alım',
        url: `${KAP_BASE}/tr/Bildirim/123459`,
        summary: '100M TL pay geri alım programı',
      },
    ];

    return mockDisclosures;
  } catch (err) {
    console.error('[KAP] Fetch error:', err);
    return [];
  }
}

/**
 * Download KAP disclosure file/attachment
 * 
 * @param disclosureId KAP disclosure ID
 * @returns File buffer
 */
export async function downloadKAPFile(disclosureId: string): Promise<Buffer> {
  try {
    const url = `${KAP_BASE}/tr/api/file/download/${disclosureId}`;
    console.log('[KAP] Downloading file:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('[KAP] Download error:', err);
    throw err;
  }
}

/**
 * Start periodic KAP polling
 * Polls KAP every N minutes for new disclosures
 */
export function startKAPPolling(
  intervalMinutes: number = 15,
  onNewDisclosure: (disclosure: KAPDisclosure) => void
): () => void {
  console.log(`[KAP] Starting polling (interval: ${intervalMinutes} minutes)`);

  let lastScanTime = new Date();
  
  const pollInterval = setInterval(async () => {
    try {
      const disclosures = await fetchKAPList({
        from: lastScanTime.toISOString(),
      });

      for (const disclosure of disclosures) {
        onNewDisclosure(disclosure);
      }

      lastScanTime = new Date();
      console.log(`[KAP] Poll complete: ${disclosures.length} new disclosures`);
    } catch (err) {
      console.error('[KAP] Poll error:', err);
    }
  }, intervalMinutes * 60 * 1000);

  // Return cleanup function
  return () => {
    clearInterval(pollInterval);
    console.log('[KAP] Polling stopped');
  };
}

