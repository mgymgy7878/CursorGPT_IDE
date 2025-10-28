import { ReferenceLine, Label } from 'recharts';

export function SafeZeroLine() {
  return <ReferenceLine y={0} strokeDasharray="3 3" label={<Label value="0" position="right" />} />;
}

