import { ReferenceLine, Label } from "recharts";

type SafeRefProps = { y: number; label?: string | number; dash?: string };

export function SafeReferenceLine({
  y,
  label = "",
  dash = "3 3",
}: SafeRefProps) {
  return (
    <ReferenceLine
      y={y}
      strokeDasharray={dash}
      label={<Label value={String(label)} position="right" />}
    />
  );
}

export const SafeZeroLine = () => <SafeReferenceLine y={0} label="0" />;
