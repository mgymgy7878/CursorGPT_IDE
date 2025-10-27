'use client';
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; msg?: string };

export class SafeBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: any) {
    return { hasError: true, msg: String(err?.message ?? err) };
  }
  componentDidCatch(err: any, info: any) {
    console.error('SafeBoundary caught:', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-4">
          <div className="text-sm text-red-400">UI hata yakalandı: {this.state.msg}</div>
          <button
            onClick={() => this.setState({ hasError:false })}
            className="mt-2 px-3 py-1 text-xs rounded bg-zinc-800 border border-zinc-700">
            tekrar dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SafeBoundary; 