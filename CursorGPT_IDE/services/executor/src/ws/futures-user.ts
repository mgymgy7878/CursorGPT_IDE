import WebSocket from 'ws';

export type UdsStatus = 'idle'|'connecting'|'connected'|'closed'|'reconnecting';

export class FuturesUserWs {
  private urlBase: string;
  private listenKey?: string;
  private ws?: WebSocket;
  private status: UdsStatus = 'idle';
  private backoffMs = 1000;

  constructor(urlBase: string){
    this.urlBase = urlBase.replace(/\/$/, '');
  }

  connect(listenKey: string, onEvent: (ev:any)=>void){
    this.listenKey = listenKey;
    const url = `${this.urlBase}/ws/${listenKey}`;
    this.status = 'connecting';
    this.ws = new WebSocket(url);
    this.ws.on('open', ()=>{ this.status = 'connected'; this.backoffMs = 1000; });
    this.ws.on('message', (buf)=>{
      try { const obj = JSON.parse(buf.toString()); onEvent(obj); } catch {}
    });
    this.ws.on('close', ()=> this.scheduleReconnect(onEvent));
    this.ws.on('error', ()=> this.scheduleReconnect(onEvent));
  }

  private scheduleReconnect(onEvent:(ev:any)=>void){
    this.status = 'reconnecting';
    setTimeout(()=>{
      if (!this.listenKey) return;
      this.connect(this.listenKey, onEvent);
      this.backoffMs = Math.min(this.backoffMs*2, 30000);
    }, this.backoffMs);
  }
}


