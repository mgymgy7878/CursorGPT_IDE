"use client";

import { ReferenceLine, Label } from "recharts";

type SafeRefProps = {
  y: number;
  label?: string | number;
  dash?: string;
};

// @ts-ignore - recharts v3 type compatibility
const ReferenceLineFixed = ReferenceLine as any;

export function SafeReferenceLine({
  y,
  label = "",
  dash = "3 3",
}: SafeRefProps) {
  return (
    <ReferenceLineFixed
      y={y}
      strokeDasharray={dash}
      label={
        label ? <Label value={String(label)} position="right" /> : undefined
      }
    />
  );
}

export const SafeZeroLine = () => <SafeReferenceLine y={0} label="0" />;
