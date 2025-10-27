'use client';
import { useEffect, useRef, useState } from 'react';

export default function useTimeseriesBuffer<T extends Record<string, number>>(
  sample: T | undefined,
  opts?: { max?: number }
) {
  const max = opts?.max ?? 40;
  const ref = useRef<T[]>([]);
  const [, setBump] = useState(0);

  useEffect(() => {
    if (!sample) return;
    ref.current.push(sample);
    if (ref.current.length > max) ref.current.shift();
    setBump((x) => x + 1);
  }, [JSON.stringify(sample), max]);

  return ref.current;
}

