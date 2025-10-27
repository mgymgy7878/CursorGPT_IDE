export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchDecisions() {
  try {
    const res = await fetch('http://127.0.0.1:3003/api/mock/guard/decisions', { 
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export default async function GuardrailsPage() {
  const decisions = await fetchDecisions();

  return (
    <div style={{padding:16}}>
      <h1 style={{fontSize:18, marginBottom:8}}>Guardrails Panel</h1>
      <p style={{fontSize:14, marginBottom:16, opacity:0.7}}>
        Son {decisions.length} karar - v1.3 mock veri
      </p>
      
      <div style={{overflow:'auto', border:'1px solid #e5e7eb', borderRadius:8}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{backgroundColor:'#f9fafb'}}>
              <th style={{padding:12, textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>ID</th>
              <th style={{padding:12, textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Zaman</th>
              <th style={{padding:12, textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Skor</th>
              <th style={{padding:12, textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>İzin</th>
              <th style={{padding:12, textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Onay</th>
              <th style={{padding:12, textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Nedenler</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((d: any) => (
              <tr key={d.decision_id}>
                <td style={{padding:12, borderBottom:'1px solid #e5e7eb', fontFamily:'monospace'}}>
                  {d.decision_id}
                </td>
                <td style={{padding:12, borderBottom:'1px solid #e5e7eb'}}>
                  {new Date(d.ts).toLocaleString('tr-TR')}
                </td>
                <td style={{padding:12, borderBottom:'1px solid #e5e7eb'}}>
                  <span style={{
                    color: d.score >= 80 ? '#059669' : d.score >= 60 ? '#d97706' : '#dc2626',
                    fontWeight:'bold'
                  }}>
                    {d.score}/100
                  </span>
                </td>
                <td style={{padding:12, borderBottom:'1px solid #e5e7eb'}}>
                  <span style={{
                    color: d.allowed ? '#059669' : '#dc2626',
                    fontWeight:'bold'
                  }}>
                    {d.allowed ? '✅ İzin' : '❌ Red'}
                  </span>
                </td>
                <td style={{padding:12, borderBottom:'1px solid #e5e7eb'}}>
                  {d.confirm_required ? '🔒 Gerekli' : '🔓 Gerekmez'}
                </td>
                <td style={{padding:12, borderBottom:'1px solid #e5e7eb'}}>
                  {d.reasons?.join(', ') || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {decisions.length === 0 && (
        <p style={{textAlign:'center', padding:32, opacity:0.5}}>
          Mock API'den veri alınamadı
        </p>
      )}
    </div>
  );
}
