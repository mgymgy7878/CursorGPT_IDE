"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Role } from "@spark/types";

function getRoles(): Role[] {
  const m = document.cookie.split("; ").find(x => x.startsWith("spark_roles="));
  if (!m) return [];
  const v = decodeURIComponent(m.split("=")[1] ?? "");
  return (v.split(",").filter(Boolean) as Role[]);
}

export default function Nav() {
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => setRoles(getRoles()), []);
  const isTrader = roles.includes("trader") || roles.includes("admin");

  return (
    <nav className="flex gap-4 p-3 border-b" data-testid="nav">
      <Link href="/parity" data-testid="nav-parity">Parity</Link>
      <Link href="/portfolio" data-testid="nav-portfolio">Portfolio</Link>
      <Link href="/btcturk" data-testid="nav-btcturk">BTCTurk</Link>
      {isTrader && <Link href="/strategies" data-testid="nav-strategies">Strategies</Link>}
      {isTrader && <Link href="/backtest" data-testid="nav-backtest">Backtest</Link>}
      <span className="ml-auto">
        <Link href="/login" data-testid="nav-login">Login</Link>
      </span>
    </nav>
  );
} 
