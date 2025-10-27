"use client";

import Modal from "@/components/modal/Modal";

export interface ConfirmGateModalProps {
  request: Record<string, any>;
  computedNotional?: number;
  leverage?: number;
  whitelistHit?: boolean;
  reason?: string;
  onDryRun: () => Promise<void> | void;
  onSendIntent: () => Promise<void> | void;
  onClose: () => void;
}

export default function ConfirmGateModal(props: ConfirmGateModalProps) {
  const {
    request,
    computedNotional,
    leverage,
    whitelistHit,
    reason,
    onDryRun,
    onSendIntent,
    onClose,
  } = props;

  const symbol = (request as any)?.symbol ?? "—";
  const side = (request as any)?.side ?? "—";
  const type = (request as any)?.type ?? "—";
  const quantity = (request as any)?.quantity ?? (request as any)?.qty ?? "—";

  return (
    <Modal title="Onay Gerekli (Futures Gate Kapalı)" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="text-sm text-gray-300">
          Gates kapalı — bu emrin yürütülmesi için onay akışı gerekir. Aşağıdaki
          risk özetini kontrol edin ve uygun işlemi seçin.
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/40">
            <div className="text-gray-400">Sembol</div>
            <div className="font-semibold text-white">{symbol}</div>
          </div>
          <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/40">
            <div className="text-gray-400">Yön</div>
            <div className="font-semibold text-white">{String(side)}</div>
          </div>
          <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/40">
            <div className="text-gray-400">Tip</div>
            <div className="font-semibold text-white">{String(type)}</div>
          </div>
          <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/40">
            <div className="text-gray-400">Miktar</div>
            <div className="font-semibold text-white">{String(quantity)}</div>
          </div>
          <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/40">
            <div className="text-gray-400">Notional</div>
            <div className="font-semibold text-white">{computedNotional ? computedNotional.toLocaleString() : "—"}</div>
          </div>
          <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/40">
            <div className="text-gray-400">Kaldıraç</div>
            <div className="font-semibold text-white">{leverage ?? "—"}x</div>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          {typeof whitelistHit === "boolean" && (
            <span className={whitelistHit ? "text-emerald-400" : "text-yellow-400"}>
              Whitelist: {whitelistHit ? "eşleşti" : "eşleşmedi"}
            </span>
          )}
          {reason && (
            <span className="ml-2 text-gray-400">Sebep: {reason}</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
            onClick={onClose}
          >
            Kapat
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-yellow-500/60 bg-yellow-600 text-white hover:bg-yellow-700"
            onClick={() => void onDryRun()}
          >
            Kuru Çalıştır
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-emerald-500/60 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => void onSendIntent()}
          >
            Onay İçin Gönder
          </button>
        </div>
      </div>
    </Modal>
  );
}


