import { NextResponse } from "next/server";

// Basit RSS to JSON (Coindesk + TRT Ekonomi). Kütüphane kullanmadan minimal parse.
async function fetchRss(url: string) {
  const res = await fetch(url, { next: { revalidate: 120 }});
  if (!res.ok) return [];
  const xml = await res.text();
  const items = xml.split("<item>").slice(1).map(x => x.split("</item>")[0]);
  return items.map(chunk => {
    const title = (chunk.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1])
               || (chunk.match(/<title>(.*?)<\/title>/)?.[1]) || "Untitled";
    const link  = (chunk.match(/<link>(.*?)<\/link>/)?.[1]) || "#";
    const pub   = (chunk.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]) || "";
    return { title, link, pubDate: pub };
  }).slice(0, 12);
}

export async function GET() {
  try {
    const sources = [
      "https://www.coindesk.com/arc/outboundfeeds/rss/",
      "https://www.trthaber.com/xml_mobile.php?tur=ekonomi"
    ];
    const [a,b] = await Promise.all(sources.map(fetchRss));
    return NextResponse.json({ ok:true, items: [...a, ...b].slice(0,20) });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e) }, { status: 500 });
  }
}
