'use client';
import { useEffect, useRef, useState } from 'react';

export function useVisible<T extends HTMLElement>(options?: IntersectionObserverInit){
  const ref = useRef<T|null>(null);
  const [visible,setVisible] = useState(false);
  useEffect(()=>{
    if(!ref.current) return;
    const io = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setVisible(true); }, { root:null, rootMargin:'0px 0px -10% 0px', threshold:0.01, ...(options||{}) });
    io.observe(ref.current);
    return ()=> io.disconnect();
  },[options]);
  return { ref, visible } as const;
}


