"use client";
import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function CanaryPage() {
  useEffect(() => {
    redirect('/control?tab=canary');
  }, []);
  return null;
}
