export default function StrategiesLoading() {
  return (
    <div className="min-h-screen grid place-items-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-neutral-400">Stratejiler yükleniyor...</p>
      </div>
    </div>
  );
}

