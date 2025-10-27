export default function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border p-10 text-center space-y-3">
      <h3 className="text-lg font-semibold">Henüz stratejin yok</h3>
      <p className="opacity-70">
        "Yeni Strateji" ile bir taslak oluştur ve düzenlemek için Strategy Lab’e geç.
      </p>
      <button className="px-3 py-2 rounded-xl bg-blue-600 text-white" onClick={onCreate}>
        + Yeni Strateji
      </button>
    </div>
  );
}
