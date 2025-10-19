"use client";
export default function AlarmsWidget() {
  return (
    <div className="rounded-2xl border border-neutral-800 p-4">
      <div className="mb-2 font-medium">Alarms</div>
      <ul className="list-disc pl-5 text-sm text-neutral-500">
        <li>No recent violations</li>
      </ul>
    </div>
  );
}

