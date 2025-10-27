'use client';
export default function Error({error, reset}:{error:Error; reset:()=>void}){
  return <div className="p-4 text-sm">
    <div className="text-rose-400 mb-2">AI sayfası yüklenemedi.</div>
    <button onClick={reset} className="px-2 py-1 rounded border border-zinc-700">Retry</button>
  </div>;
} 