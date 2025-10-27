"use client";
import useSWR from "swr";

const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function NewsFeed() {
  // basit cache; 2dk'da bir server revalidate ediyor
  const { data } = useSWR("/api/news/crypto", fetcher, { refreshInterval: 120000 });
  const items = data?.items || [];
  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold text-neutral-200">Haber Akışı</div>
      {!items.length ? (
        <div className="text-sm text-neutral-400">Haberler yükleniyor…</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it:any, i:number)=>(
            <li key={i} className="text-sm">
              <a className="text-neutral-200 hover:underline" href={it.link} target="_blank">{it.title}</a>
              {it.pubDate ? <span className="text-neutral-500"> — {new Date(it.pubDate).toLocaleString()}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
