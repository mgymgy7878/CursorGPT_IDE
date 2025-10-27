'use client';
import Link from "next/link";

export default function AppNav() {
  return (
    <nav style={{ 
      display: 'flex', 
      gap: '16px', 
      padding: '8px 16px', 
      overflowX: 'auto' 
    }}>
      <Link href="/dashboard" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Anasayfa</Link>
      <Link href="/strategy-lab" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Strategy Lab</Link>
      <Link href="/strategies" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Strategies</Link>
      <Link href="/orders" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Orders</Link>
      <Link href="/positions" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Positions</Link>
      <Link href="/signals" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Signals</Link>
      <Link href="/risk" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Risk</Link>
      <Link href="/monitoring" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Monitoring</Link>
      <Link href="/logs" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Logs</Link>
      <Link href="/settings" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>Settings</Link>
      <Link href="/bist" style={{
        padding: '8px 12px',
        fontSize: '14px',
        color: '#d1d5db',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s',
        border: '1px solid transparent'
      }}>BIST</Link>
    </nav>
  );
} 
