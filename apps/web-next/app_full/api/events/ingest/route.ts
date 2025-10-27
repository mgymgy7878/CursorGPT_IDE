import { NextResponse } from "next/server"

let buf: any[] = []
let newsTotal = 0
let sentimentTotal = 0
let newsConfSum = 0

export const POST = async (req:Request)=>{
  const arr = await req.json()
  if (Array.isArray(arr)) {
    buf.push(...arr)
    for (const e of arr) {
      if (e?.type==='news') { newsTotal++; newsConfSum += Number(e?.confidence||0) }
      if (e?.type==='sentiment') { sentimentTotal++; newsConfSum += Number(e?.confidence||0) }
    }
  }
  return NextResponse.json({ok:true,count:buf.length})
}
export const GET  = async ()=> NextResponse.json({ ok:true, count:buf.length, newsTotal, sentimentTotal, newsConfAvg: buf.length? (newsConfSum/Math.max(1, newsTotal+sentimentTotal)) : 0 })

// export { newsTotal as spark_news_events_total, sentimentTotal as spark_sentiment_events_total } 
