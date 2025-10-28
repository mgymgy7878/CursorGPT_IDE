import React from "react";
import { ReferenceLine as ReferenceLineClass, Label } from "recharts";

type SafeRefProps = { y: number; label?: string | number; dash?: string };

// Recharts v3 exports ReferenceLine as a class component, which causes type issues
// This wrapper provides a type-safe interface
export function SafeReferenceLine({
  y,
  label = "",
  dash = "3 3",
}: SafeRefProps) {
  // Use React.createElement to bypass JSX type checking issues
  return React.createElement(ReferenceLineClass as any, {
    y,
    strokeDasharray: dash,
    label: React.createElement(Label as any, {
      value: String(label),
      position: "right",
    }),
  });
}

export const SafeZeroLine = () => <SafeReferenceLine y={0} label="0" />;
