"use client";
import { Component, ReactNode, Suspense } from "react";

class Boundary extends Component<{ children: ReactNode }, { err?: string }> {
  state = { err: undefined as string | undefined };
  static getDerivedStateFromError(e: any) { return { err: e?.message || "render error" }; }
  componentDidCatch() { /* no-op: already captured */ }
  render() {
    if (this.state.err) {
      return <div className="rounded-2xl border border-red-700 p-4 text-sm text-red-400 bg-red-950/20">
        <b>Widget error:</b> {this.state.err}
      </div>;
    }
    return this.props.children as any;
  }
}

export default function Safe({ children }: { children: ReactNode }) {
  return (
    <Boundary>
      <Suspense fallback={<div className="h-24 rounded-2xl border border-neutral-800 animate-pulse bg-neutral-900" />} >
        {children}
      </Suspense>
    </Boundary>
  );
}

