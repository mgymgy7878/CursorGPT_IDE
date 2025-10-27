/// Geçici ambient module shims — gerçek paketler hazır olana kadar derlemeyi açar.
/// Not: Canlıda kalıcı bırakmayacağız.
declare module "@spark/shared" { const x: any; export = x; }
declare module "@spark/agents" { const x: any; export = x; }
declare module "@spark/backtester" { const x: any; export = x; }
declare module "@spark/db-lite" { const x: any; export = x; }
declare module "@spark/types" { const x: any; export = x; }
declare module "@spark/exchange-btcturk" { const x: any; export = x; }
declare module "@spark/exchange/binance" { const x: any; export = x; }
