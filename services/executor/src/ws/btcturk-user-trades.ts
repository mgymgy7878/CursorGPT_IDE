import WebSocket from "ws";
import { fillsBus } from "../fills-bus.js";

export function startBtcturkUserTrades(){
	const url = String(process.env.BTCTURK_WS_URL||''); if(!url) return;
	let ws: WebSocket|undefined;
	function connect(){
		ws = new WebSocket(url, { handshakeTimeout: 10000 });
		ws.on('open', ()=>{ /* TODO: auth mesajı (apiKey/signature/time) — prod’da doldur */ });
		ws.on('message', (buf)=> {
			try{
				const msg = JSON.parse(String(buf));
				// TODO: prod’da gerçek şema ile eşleştir.
				// if (msg?.type==='trade' && msg?.data?.orderId) {
				// 	fillsBus.markFill({ ex:'btcturk', orderId: String(msg.data.orderId), tFill: Date.now() });
				// }
			}catch{}
		});
		ws.on('close', ()=>{ setTimeout(connect, 1000); });
		ws.on('error', ()=>{ try{ ws?.close(); }catch{} });
	}
	connect();
	const hb = setInterval(()=>{ try{ ws?.ping(); }catch{} }, Number(process.env.BTCTURK_WS_HEARTBEAT_MS||15000));
	return ()=>{ clearInterval(hb); try{ ws?.close(); }catch{} };
} 