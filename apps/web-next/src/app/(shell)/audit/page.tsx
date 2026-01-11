"use client";
export const dynamic = 'force-dynamic';
import { useEffect } from 'react';
import { redirect } from "next/navigation";

export default function Page() {
  useEffect(() => {
    redirect('/control?tab=audit');
  }, []);
  return null;
}
