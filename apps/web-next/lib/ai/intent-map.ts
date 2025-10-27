export async function runIntent(cmd: string) {
  cmd = cmd.toLowerCase().trim();
  if (cmd.startsWith('grid') || cmd.startsWith('trend') || cmd.startsWith('scalp') || cmd.startsWith('başlat') || cmd.startsWith('durdur')) {
    const mode = cmd.includes('grid') ? 'grid' :
                 cmd.includes('trend') ? 'trend' :
                 cmd.includes('scalp') ? 'scalp' :
                 cmd.includes('durdur') ? 'stop' : 'start';
    const res = await fetch('/api/public/strategy/mode', { method:'POST', body: JSON.stringify({ mode }) });
    return await res.json();
  }
  const rx = cmd.match(/risk\s*%?(\d+(\.\d+)?)/);
  if (rx) {
    const percent = Number(rx[1]);
    const res = await fetch('/api/public/risk/set', { method:'POST', body: JSON.stringify({ percent }) });
    return await res.json();
  }
  if (cmd.includes('özet') || cmd.includes('rapor')) {
    const res = await fetch('/api/public/manager/summary', { cache:'no-store' as any });
    return await res.json();
  }
  return { ok:false, message:'intent_not_mapped' };
} 