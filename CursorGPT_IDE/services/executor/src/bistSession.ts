// import { DateTime } from "luxon"; // TODO: Add luxon dependency

export type Holiday = { date: string; halfDay?: boolean }; // "2025-06-06"

// 2025 BIST resmi tatilleri
export const BIST_HOLIDAYS_2025: Holiday[] = [
  { date: "2025-01-01", halfDay: false }, // Yılbaşı
  { date: "2025-04-23", halfDay: false }, // Ulusal Egemenlik ve Çocuk Bayramı
  { date: "2025-05-01", halfDay: false }, // Emek ve Dayanışma Günü
  { date: "2025-05-19", halfDay: false }, // Atatürk'ü Anma, Gençlik ve Spor Bayramı
  { date: "2025-07-15", halfDay: false }, // Demokrasi ve Milli Birlik Günü
  { date: "2025-08-30", halfDay: false }, // Zafer Bayramı
  { date: "2025-10-29", halfDay: false }, // Cumhuriyet Bayramı
  { date: "2025-12-31", halfDay: true },  // Yılbaşı arifesi (yarım gün)
];

export function isBistOpen(nowISO: string, holidays: Holiday[] = BIST_HOLIDAYS_2025): boolean {
  // TODO: Implement with luxon when dependency is added
  return true; // Temporary fallback - always open
}

export function getBistSessionInfo(nowISO: string, holidays: Holiday[] = BIST_HOLIDAYS_2025) {
  // TODO: Implement with luxon when dependency is added
  const isOpen = isBistOpen(nowISO, holidays);
  
  return {
    isOpen,
    isHoliday: false,
    isHalfDay: false,
    nextOpen: null,
    nextClose: null,
    currentTime: nowISO,
    timezone: "Europe/Istanbul"
  };
}

// Test helper
export function testBistSession() {
  const testCases = [
    { time: "2025-01-15T11:00:00+03:00", expected: true, desc: "Normal gün 11:00" },
    { time: "2025-01-15T19:00:00+03:00", expected: false, desc: "Normal gün 19:00" },
    { time: "2025-12-31T12:50:00+03:00", expected: false, desc: "Yarım gün 12:50" },
    { time: "2025-01-15T09:30:00+03:00", expected: false, desc: "Açılış öncesi" },
    { time: "2025-01-18T11:00:00+03:00", expected: false, desc: "Cumartesi" },
    { time: "2025-01-01T11:00:00+03:00", expected: false, desc: "Tatil günü" }
  ];
  
  console.log("BIST Session Tests:");
  testCases.forEach(test => {
    const result = isBistOpen(test.time);
    const status = result === test.expected ? "✅" : "❌";
    console.log(`${status} ${test.desc}: ${result} (expected: ${test.expected})`);
  });
}