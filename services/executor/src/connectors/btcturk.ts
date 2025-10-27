import crypto from "node:crypto";

const BASE = 'https://api.btcturk.com';

export type BTOrderSide = 'buy'|'sell';
export type BTOrderMethod = 'market'|'limit'|'stoplimit'|'stopmarket';

function authHeaders(){
	const key  = String(process.env.BTCTURK_API_KEY||'');
	const secB64 = String(process.env.BTCTURK_API_SECRET_BASE64||'');
	const stamp = Date.now().toString(); // unix ms
	const sig  = crypto.createHmac('sha256', Buffer.from(secB64, 'base64'))
						 .update(Buffer.from(key+stamp,'utf8'))
						 .digest('base64');
	return { 'Content-Type':'application/json', 'X-PCK': key, 'X-Stamp': stamp, 'X-Signature': sig };
}

async function http(path:string, method='GET', body?:any, auth=false){
	const url = `${BASE}${path}`;
	const init: RequestInit = { method, headers: auth ? authHeaders() : { 'Content-Type':'application/json' } };
	if (body!==undefined) init.body = JSON.stringify(body);
	const res = await fetch(url, init);
	const json = await res.json().catch(()=>({}));
	if(!res.ok) throw Object.assign(new Error('btcturk_error'),{ status:res.status, body:json });
	return json;
}

export async function getServerTime(){ return http('/api/v2/server/time','GET'); }
export async function getExchangeInfo(){ return http('/api/v2/server/exchangeinfo','GET'); }
export async function submitOrder(params:{
	quantity:number; price?:number; newOrderClientId?:string;
	orderMethod: BTOrderMethod; orderType: BTOrderSide; pairSymbol:string;
}){
	return http('/api/v1/order','POST', params, true);
}

/** Get single order by orderId */
export async function btcturkGetSingleOrder(orderId:string){
	return http(`/api/v1/order?id=${encodeURIComponent(orderId)}`, 'GET', undefined, true);
}
/** Get user trades filtered by orderId or pairSymbol */
export async function btcturkGetUserTrades(params:{ orderId?:string; pairSymbol?:string; startDate?:number; endDate?:number }={}){
	const q = new URLSearchParams();
	if (params.orderId) q.set('orderId', params.orderId);
	if (params.pairSymbol) q.set('pairSymbol', params.pairSymbol);
	if (params.startDate) q.set('startDate', String(params.startDate));
	if (params.endDate) q.set('endDate', String(params.endDate));
	return http(`/api/v1/users/transactions/trade?${q.toString()}`, 'GET', undefined, true);
}

/**
 * BTCTurk hesap bakiyelerini çeker
 * @returns User balance information including all assets
 */
export async function getAccountBalances(){
	return http('/api/v1/users/balances', 'GET', undefined, true);
}

/**
 * BTCTurk'te tüm semboller için güncel fiyatları çeker (ticker)
 */
export async function getAllTickers(){
	return http('/api/v2/ticker', 'GET');
}

/**
 * BTCTurk'te belirli bir sembol için güncel fiyat bilgisi
 * @param pairSymbol - Sembol çifti (örn: BTCTRY, USDTTRY)
 */
export async function getTicker(pairSymbol: string){
	return http(`/api/v2/ticker?pairSymbol=${encodeURIComponent(pairSymbol)}`, 'GET');
} 