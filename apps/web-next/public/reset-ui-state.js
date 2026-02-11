/**
 * UI State Reset Script - Console'da çalıştır
 *
 * Kullanım (DevTools Console):
 *
 * // Sadece UI state temizle (önerilen)
 * Object.keys(localStorage).filter(k => k.startsWith('ui.')).forEach(k => localStorage.removeItem(k));
 * location.reload();
 *
 * // Tüm localStorage temizle
 * localStorage.clear();
 * location.reload();
 *
 * // Mevcut key'leri göster
 * console.table(Object.keys(localStorage).map(k => ({ key: k, value: localStorage.getItem(k).substring(0, 50) })));
 */

// Export for use in console
if (typeof window !== 'undefined') {
  window.resetUIState = function() {
    const uiKeys = ['ui.sidebarCollapsed', 'ui.rightRailOpen'];
    let cleared = 0;
    uiKeys.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    console.log(`✅ ${cleared} UI state key'i temizlendi. Sayfa yenileniyor...`);
    setTimeout(() => location.reload(), 500);
  };

  window.showLocalStorage = function() {
    console.table(
      Object.keys(localStorage).map(k => ({
        key: k,
        value: localStorage.getItem(k).substring(0, 80) + '...'
      }))
    );
  };
}

