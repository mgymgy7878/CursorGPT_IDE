'use client';
import { useEffect, useState } from "react";
import { bus } from "@/lib/event-bus";
import BacktestModal from "./BacktestModal";
import OptimizeModal from "./OptimizeModal";
import RunModal from "./RunModal";

type Kind = 'backtest' | 'optimize' | 'run';
type ModalState = null | { kind: Kind; payload?: any };

export default function ModalRoot() {
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    const close = () => setModal(null);
    const openBacktest = (p: any) => setModal({ kind: 'backtest', payload: p });
    const openOptimize = (p: any) => setModal({ kind: 'optimize', payload: p });
    const openRun      = (p: any) => setModal({ kind: 'run',      payload: p });

    // tek tek abone ol
    bus.on('lab:open:backtest', openBacktest);
    bus.on('lab:open:optimize', openOptimize);
    bus.on('lab:open:run',      openRun);
    bus.on('modal:close',       close);

    // component unmount'ında temizle
    return () => {
      bus.off('lab:open:backtest', openBacktest);
      bus.off('lab:open:optimize', openOptimize);
      bus.off('lab:open:run',      openRun);
      bus.off('modal:close',       close);
    };
  }, []);

  if (!modal) return null;

  // Burada modalları anahtarla
  if (modal.kind === 'backtest') {
    return <BacktestModal payload={modal.payload} onClose={() => bus.emit('modal:close')} />;
  }
  if (modal.kind === 'optimize') {
    return <OptimizeModal payload={modal.payload} onClose={() => bus.emit('modal:close')} />;
  }
  return <RunModal payload={modal.payload} onClose={() => bus.emit('modal:close')} />;
} 